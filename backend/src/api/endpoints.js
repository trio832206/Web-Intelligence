import express from 'express';
import { uuidv4 } from '../utils/uuid.js';
import { db, CrawlJob, ExtractedEntity, AlertRule, AlertNotification, isMongoReady } from '../database.js';
import { executeCrawl } from '../crawler/engine.js';
import { requireAuth } from './auth.js';

export const endpointsRouter = express.Router();

// POST /api/v1/crawls { url, depth, use_browser, strict_robots }
endpointsRouter.post('/crawls', async (req, res) => {
  const { url, depth = 1, use_browser = false, strict_robots = false } = req.body || {};

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid target URL starting with http:// or https:// is required' });
  }

  const jobId = uuidv4();
  const now = new Date().toISOString();
  const numDepth = Math.max(1, Math.min(3, parseInt(depth, 10) || 1));

  if (isMongoReady()) {
    CrawlJob.create({
      _id: jobId,
      url: url.trim(),
      depth: numDepth,
      status: 'pending',
      created_at: new Date(now)
    }).catch(() => null);
  }

  db.prepare(`
    INSERT INTO crawl_jobs (id, url, depth, status, created_at)
    VALUES (?, ?, ?, 'pending', ?)
  `).run(jobId, url.trim(), numDepth, now);

  // Trigger background crawl
  setImmediate(() => {
    executeCrawl(jobId, url.trim(), numDepth, Boolean(use_browser), Boolean(strict_robots)).catch(err => {
      console.error(`[Crawl Execution Error] ${jobId}:`, err.message);
    });
  });

  res.status(202).json({
    message: 'Crawl job queued successfully',
    job_id: jobId,
    url: url.trim(),
    depth: numDepth,
    status: 'pending'
  });
});

// GET /api/v1/crawls (last 20 jobs)
endpointsRouter.get('/crawls', (req, res) => {
  const jobs = db.prepare(`
    SELECT * FROM crawl_jobs 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all();

  res.json({ jobs });
});

// DELETE /api/v1/crawls (bulk delete)
endpointsRouter.delete('/crawls', async (req, res) => {
  const { job_ids } = req.body || {};
  if (!Array.isArray(job_ids) || job_ids.length === 0) {
    return res.status(400).json({ error: 'job_ids must be a non-empty array of IDs' });
  }

  // Validate each ID is a safe UUID-like string (no injection vectors)
  const uuidPattern = /^[a-zA-Z0-9_-]{1,64}$/;
  if (!job_ids.every(id => typeof id === 'string' && uuidPattern.test(id))) {
    return res.status(400).json({ error: 'Invalid job ID format detected' });
  }

  if (isMongoReady()) {
    try {
      await ExtractedEntity.deleteMany({ job_id: { $in: job_ids } });
      await CrawlJob.deleteMany({ _id: { $in: job_ids } });
    } catch {}
  }

  const placeholders = job_ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM extracted_entities WHERE job_id IN (${placeholders})`).run(...job_ids);
  const deleted = db.prepare(`DELETE FROM crawl_jobs WHERE id IN (${placeholders})`).run(...job_ids);

  res.json({
    message: 'Selected crawl jobs deleted successfully',
    deleted_jobs_count: deleted.changes
  });
});

// DELETE /api/v1/crawls/:job_id (single delete)
endpointsRouter.delete('/crawls/:job_id', async (req, res) => {
  const { job_id } = req.params;
  if (!job_id) {
    return res.status(400).json({ error: 'job_id is required' });
  }

  if (isMongoReady()) {
    try {
      await ExtractedEntity.deleteMany({ job_id });
      await CrawlJob.deleteOne({ _id: job_id });
    } catch {}
  }

  db.prepare('DELETE FROM extracted_entities WHERE job_id = ?').run(job_id);
  const deleted = db.prepare('DELETE FROM crawl_jobs WHERE id = ?').run(job_id);

  res.json({
    message: 'Crawl job deleted successfully',
    deleted_jobs_count: deleted.changes
  });
});

function safeParseEntities(val) {
  if (Array.isArray(val)) return val;
  if (!val || typeof val !== 'string') return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// GET /api/v1/crawls/:job_id/status
endpointsRouter.get('/crawls/:job_id/status', (req, res) => {
  const job = db.prepare('SELECT * FROM crawl_jobs WHERE id = ?').get(req.params.job_id);
  if (!job) {
    return res.status(404).json({ error: 'Crawl job not found' });
  }

  const entity = db.prepare('SELECT * FROM extracted_entities WHERE job_id = ?').get(job.id);
  res.json({
    job,
    entity: entity ? {
      ...entity,
      named_entities: safeParseEntities(entity.named_entities)
    } : null
  });
});

// GET /api/v1/crawls/:job_id/payload (Approach D: Content & Payload Verification)
endpointsRouter.get('/crawls/:job_id/payload', (req, res) => {
  const job = db.prepare('SELECT * FROM crawl_jobs WHERE id = ?').get(req.params.job_id);
  if (!job) {
    return res.status(404).json({ error: 'Crawl job not found' });
  }

  const entity = db.prepare('SELECT * FROM extracted_entities WHERE job_id = ?').get(job.id);
  const snippet = entity?.content_snippet || '';
  const snippetLower = snippet.toLowerCase();

  const isBotChallenge = /verify you are a human|access denied|attention required|ddos-guard|cf-browser-verification|cloudflare|security check|enable cookies and javascript|robot check|captcha/i.test(snippetLower) || (snippet.length < 50 && !entity?.title);
  const isThin = snippet.length < 100;
  const wordCount = snippet ? snippet.split(/\s+/).filter(Boolean).length : 0;

  res.json({
    job_id: job.id,
    url: job.url,
    title: entity?.title || 'Untitled Document',
    snippet,
    character_count: snippet.length,
    word_count: wordCount,
    sentiment_label: entity?.sentiment_label || 'Neutral',
    sentiment_score: entity?.sentiment_score || 0,
    named_entities: entity ? safeParseEntities(entity.named_entities) : [],
    extracted_at: entity?.extracted_at || job.created_at,
    verification: {
      status: isBotChallenge ? 'BOT_BARRIER_DETECTED' : isThin ? 'THIN_CONTENT' : 'VERIFIED_OK',
      is_bot_blocked: isBotChallenge,
      is_thin: isThin,
      recommendation: isBotChallenge
        ? 'Target returned an anti-bot challenge page. Enable Headless Browser mode to bypass.'
        : isThin
        ? 'Target has minimal readable text. Target may be client-side single page app.'
        : 'Payload verified. Clean content available for data synthesis.'
    }
  });
});

// GET /api/v1/data/search?q=
endpointsRouter.get('/data/search', (req, res) => {
  const q = req.query.q ? String(req.query.q).trim() : '';

  let entities;
  if (q) {
    const pattern = `%${q}%`;
    entities = db.prepare(`
      SELECT * FROM extracted_entities 
      WHERE title LIKE ? OR content_snippet LIKE ? OR named_entities LIKE ?
      ORDER BY extracted_at DESC 
      LIMIT 50
    `).all(pattern, pattern, pattern);
  } else {
    entities = db.prepare(`
      SELECT * FROM extracted_entities 
      ORDER BY extracted_at DESC 
      LIMIT 50
    `).all();
  }

  const parsed = entities.map(e => ({
    ...e,
    named_entities: safeParseEntities(e.named_entities)
  }));

  res.json({ entities: parsed, count: parsed.length });
});

// POST /api/v1/alerts { keyword, condition }
endpointsRouter.post('/alerts', (req, res) => {
  const { keyword, condition = 'contains' } = req.body || {};
  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  const validConditions = ['contains', 'sentiment_negative', 'sentiment_positive'];
  const cond = validConditions.includes(condition) ? condition : 'contains';

  const id = uuidv4();
  const userId = req.user?.id || 'anonymous';
  const now = new Date().toISOString();

  if (isMongoReady()) {
    AlertRule.create({
      _id: id,
      user_id: userId,
      keyword: keyword.trim(),
      condition: cond,
      created_at: new Date(now)
    }).catch(() => null);
  }

  db.prepare(`
    INSERT INTO alert_rules (id, user_id, keyword, condition, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, keyword.trim(), cond, now);

  res.status(201).json({
    message: 'Alert rule created successfully',
    rule: { id, user_id: userId, keyword: keyword.trim(), condition: cond, created_at: now }
  });
});

// GET /api/v1/alerts
endpointsRouter.get('/alerts', (req, res) => {
  const rules = db.prepare('SELECT * FROM alert_rules ORDER BY created_at DESC').all();
  const notifications = db.prepare('SELECT * FROM alert_notifications ORDER BY created_at DESC LIMIT 50').all();

  res.json({
    rules,
    notifications
  });
});

// DELETE /api/v1/alerts/:id
endpointsRouter.delete('/alerts/:id', (req, res) => {
  const ruleId = req.params.id;

  if (isMongoReady()) {
    AlertRule.deleteOne({ _id: ruleId }).catch(() => null);
    AlertNotification.deleteMany({ rule_id: ruleId }).catch(() => null);
  }

  db.prepare('DELETE FROM alert_rules WHERE id = ?').run(ruleId);
  db.prepare('DELETE FROM alert_notifications WHERE rule_id = ?').run(ruleId);

  res.json({ message: 'Alert rule deleted successfully', ruleId });
});
