import express from 'express';
import { uuidv4 } from '../utils/uuid.js';
import { db, CrawlJob, ExtractedEntity, isMongoConnected } from '../database.js';
import { requireAuth } from './auth.js';
import { extractResearchUrls } from '../ai/gemini.js';
import { executeCrawl } from '../crawler/engine.js';
import { semanticSearch } from '../ai/embeddings.js';

export const researchRouter = express.Router();

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

// POST /api/v1/research/query
researchRouter.post('/query', requireAuth, async (req, res) => {
  const { prompt, max_urls = 5, depth = 1, location = '' } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Research prompt is required' });
  }

  const numUrls = Math.max(1, Math.min(10, parseInt(max_urls, 10) || 5));
  const numDepth = Math.max(1, Math.min(3, parseInt(depth, 10) || 1));
  const sessionId = `ses_${uuidv4()}`;
  const now = new Date().toISOString();

  try {
    // 1. Derive research target URLs using Gemini or intelligent search fallback
    const targetUrls = await extractResearchUrls(prompt.trim(), location.trim(), numUrls);

    if (!targetUrls || targetUrls.length === 0) {
      return res.status(500).json({ error: 'Failed to identify valid research targets for prompt' });
    }

    const createdJobs = [];

    // Quota enforcement – re-check role + subscription expiry from DB (JWT may be stale)
    const userId = req.user.id;
    const dbUser = db.prepare('SELECT role, premium_expires_at FROM users WHERE id = ?').get(userId);
    const nowDate = new Date();
    const isPremium = dbUser &&
      dbUser.role === 'premium' &&
      (!dbUser.premium_expires_at || new Date(dbUser.premium_expires_at) > nowDate);

    if (!isPremium) {
      const todayCount = db.prepare(`
        SELECT COUNT(*) as cnt FROM crawl_jobs
        WHERE user_id = ? AND date(created_at) = date('now')
      `).get(userId)?.cnt ?? 0;
      if (todayCount >= 10) {
        return res.status(429).json({
          error: 'Daily crawl limit reached (10/day). Upgrade to premium for unlimited access.'
        });
      }
    }

    // 2. Create CrawlJob records with shared session_id
    for (const url of targetUrls) {
      const jobId = uuidv4();
      const isProtected = /amazon|flipkart|myntra|walmart|bestbuy/i.test(url);

      if (isMongoConnected) {
        CrawlJob.create({
          _id: jobId,
          url,
          depth: numDepth,
          status: 'pending',
          session_id: sessionId,
          research_prompt: prompt.trim(),
          created_at: new Date(now)
        }).catch(() => null);
      }

      db.prepare(`
        INSERT INTO crawl_jobs (id, user_id, url, depth, status, session_id, research_prompt, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(jobId, userId, url, numDepth, 'pending', sessionId, prompt.trim(), now);

      createdJobs.push({
        job_id: jobId,
        url,
        status: 'pending',
        is_stealth: isProtected
      });

      // 3. Dispatch crawl in background
      setImmediate(() => {
        executeCrawl(jobId, url, numDepth, isProtected, false).catch(err => {
          console.error(`[Session Crawl Error] ${jobId}:`, err.message);
        });
      });
    }

    res.status(202).json({
      message: 'Research session initiated successfully',
      session_id: sessionId,
      prompt: prompt.trim(),
      location: location.trim(),
      total_urls: createdJobs.length,
      jobs: createdJobs,
      created_at: now
    });
  } catch (err) {
    console.error('[Research Query Failure]', err);
    res.status(500).json({ error: `Research execution error: ${err.message}` });
  }
});

// GET /api/v1/research/session/:session_id
researchRouter.get('/session/:session_id', (req, res) => {
  const sessionId = req.params.session_id;

  const jobs = db.prepare(`
    SELECT * FROM crawl_jobs 
    WHERE session_id = ? 
    ORDER BY created_at ASC
  `).all(sessionId);

  if (jobs.length === 0) {
    return res.status(404).json({ error: 'Research session not found' });
  }

  const jobIds = jobs.map(j => j.id);
  const placeholders = jobIds.map(() => '?').join(',');

  const entities = db.prepare(`
    SELECT * FROM extracted_entities 
    WHERE job_id IN (${placeholders})
    ORDER BY extracted_at DESC
  `).all(...jobIds);

  const parsedEntities = entities.map(e => ({
    ...e,
    named_entities: safeParseEntities(e.named_entities)
  }));

  const total = jobs.length;
  const completed = jobs.filter(j => j.status === 'completed').length;
  const failed = jobs.filter(j => j.status === 'failed').length;
  const running = jobs.filter(j => j.status === 'running').length;
  const pending = jobs.filter(j => j.status === 'pending').length;
  const done = (completed + failed) === total;

  res.json({
    session_id: sessionId,
    prompt: jobs[0]?.research_prompt || '',
    summary: {
      total,
      completed,
      failed,
      running,
      pending,
      done
    },
    jobs,
    entities: parsedEntities
  });
});

// GET /api/v1/research/sessions (last 20 research sessions)
researchRouter.get('/sessions', (req, res) => {
  const sessions = db.prepare(`
    SELECT 
      session_id,
      research_prompt,
      MIN(created_at) as created_at,
      COUNT(id) as total_jobs,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_jobs,
      SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running_jobs,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_jobs
    FROM crawl_jobs
    WHERE session_id IS NOT NULL
    GROUP BY session_id
    ORDER BY created_at DESC
    LIMIT 20
  `).all();

  res.json({ sessions });
});

// DELETE /api/v1/research/sessions/crawls { job_ids: [...] }
researchRouter.delete('/sessions/crawls', (req, res) => {
  const { job_ids } = req.body || {};

  if (!Array.isArray(job_ids) || job_ids.length === 0) {
    return res.status(400).json({ error: 'job_ids must be a non-empty array of IDs' });
  }

  const placeholders = job_ids.map(() => '?').join(',');

  // Delete from MongoDB Atlas
  if (isMongoConnected) {
    try {
      ExtractedEntity.deleteMany({ job_id: { $in: job_ids } }).catch(() => null);
      CrawlJob.deleteMany({ _id: { $in: job_ids } }).catch(() => null);
    } catch {}
  }

  // Delete extracted entities first
  const deletedEntities = db.prepare(`
    DELETE FROM extracted_entities WHERE job_id IN (${placeholders})
  `).run(...job_ids);

  // Delete crawl jobs
  const deletedJobs = db.prepare(`
    DELETE FROM crawl_jobs WHERE id IN (${placeholders})
  `).run(...job_ids);

  res.json({
    message: 'Selected crawl jobs and extracted intelligence removed',
    deleted_jobs_count: deletedJobs.changes,
    deleted_entities_count: deletedEntities.changes
  });
});

// POST /api/v1/research/synthesize { job_ids: [...], inquiry: "..." }
researchRouter.post('/synthesize', async (req, res) => {
  const { job_ids, inquiry = '' } = req.body || {};

  if (!Array.isArray(job_ids) || job_ids.length === 0) {
    return res.status(400).json({ error: 'job_ids array is required' });
  }

  const cleanInquiry = String(inquiry || '').trim();
  const placeholders = job_ids.map(() => '?').join(',');

  const entities = db.prepare(`
    SELECT * FROM extracted_entities 
    WHERE job_id IN (${placeholders})
    ORDER BY extracted_at DESC
  `).all(...job_ids);

  if (entities.length === 0) {
    return res.json({
      matched: false,
      message: "The inquiry didn't match any selected resources",
      reason: "No extracted text snippets or intelligence records were found for the selected targets."
    });
  }

  const parsedEntities = entities.map(e => ({
    ...e,
    named_entities: safeParseEntities(e.named_entities)
  }));

  // Calculate consensus sentiment
  const totalScore = parsedEntities.reduce((acc, curr) => acc + (curr.sentiment_score || 0), 0);
  const avgScore = Math.round((totalScore / parsedEntities.length) * 100) / 100;
  let avgLabel = 'Neutral';
  if (avgScore >= 0.05) avgLabel = 'Positive';
  else if (avgScore <= -0.05) avgLabel = 'Negative';

  // Aggregate entity frequency
  const entityCounts = new Map();
  for (const ent of parsedEntities) {
    for (const item of ent.named_entities) {
      entityCounts.set(item, (entityCounts.get(item) || 0) + 1);
    }
  }
  const topSharedEntities = Array.from(entityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // If no specific inquiry was asked, synthesize standard overview
  if (!cleanInquiry) {
    const bullets = parsedEntities.map(e => {
      const sentences = (e.content_snippet || '')
        .split(/(?<=[.?!])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 25 && s.length < 240);
      return {
        title: e.title,
        url: e.url,
        bullet: sentences[0] || (e.content_snippet || '').slice(0, 160),
        sentiment: e.sentiment_label,
        score: e.sentiment_score
      };
    });

    return res.json({
      matched: true,
      inquiry: '',
      directAnswer: `Synthesized analysis across ${parsedEntities.length} selected resources with ${avgLabel} consensus polarity (${avgScore}). Key extracted themes: ${topSharedEntities.slice(0, 5).map(e => e[0]).join(', ') || 'N/A'}.`,
      keyFindings: bullets.map(b => b.bullet),
      sourceBullets: bullets,
      consensusScore: avgScore,
      consensusLabel: avgLabel,
      totalSourcesAnalyzed: parsedEntities.length,
      topSharedEntities
    });
  }

  // 1. Try Gemini 2.5 Flash if API key available
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const resourceCorpus = parsedEntities.map((e, idx) => 
        `[Resource ${idx + 1}] Title: ${e.title} | URL: ${e.url} | Content: ${(e.content_snippet || '').slice(0, 1500)}`
      ).join('\n\n');

      const systemPrompt = `You are a data synthesis intelligence engine.
Analyze the provided crawled web resources to thoroughly answer the user's specific inquiry.
CRITICAL INSTRUCTION ON RELEVANCE:
If the user's inquiry is completely irrelevant, unaddressed, or unrelated to the information present in the resources (e.g. asking about unrelated topics not mentioned in the crawled text), you MUST respond with:
{
  "matched": false,
  "message": "The inquiry didn't match any selected resources",
  "reason": "Explain briefly why the inquiry does not pertain to the provided content."
}

If the inquiry IS relevant:
Answer all questions or points asked in the inquiry thoroughly and accurately based strictly on the crawled text.
Respond with:
{
  "matched": true,
  "directAnswer": "Comprehensive direct answer addressing all aspects and questions in the inquiry.",
  "keyFindings": [
    "Specific finding or data point answering the question (Source: ...)",
    "Another finding..."
  ]
}
Respond with ONLY valid JSON.`;

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `Crawled Resources:\n${resourceCorpus}\n\nUser Inquiry: "${cleanInquiry}"` }]
          }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        })
      });

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const rawJson = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsedGemini = JSON.parse(rawJson);
          return res.json({
            ...parsedGemini,
            inquiry: cleanInquiry,
            consensusScore: avgScore,
            consensusLabel: avgLabel,
            totalSourcesAnalyzed: parsedEntities.length,
            topSharedEntities,
            sourceBullets: parsedEntities.map(e => ({
              title: e.title,
              url: e.url,
              bullet: (e.content_snippet || '').slice(0, 180),
              sentiment: e.sentiment_label,
              score: e.sentiment_score
            }))
          });
        }
      }
    } catch (gErr) {
      console.warn('[Gemini Synthesis Fallback]', gErr.message);
    }
  }

  // 2. all-MiniLM-L6-v2 Semantic Neural Vector Search (Offline ML)
  try {
    const candidateSentences = [];
    for (const ent of parsedEntities) {
      const rawSentences = (ent.content_snippet || '')
        .split(/(?<=[.?!])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 25 && s.length < 600);

      for (const s of rawSentences) {
        candidateSentences.push({
          text: s,
          title: ent.title,
          url: ent.url,
          sentiment: ent.sentiment_label,
          score: ent.sentiment_score
        });
      }
    }

    if (candidateSentences.length > 0) {
      const semanticMatches = await semanticSearch(cleanInquiry, candidateSentences, 8);
      const topScore = semanticMatches[0]?.score || 0;

      // Relevance threshold: If top semantic similarity is lower than 0.28, inquiry is irrelevant
      if (semanticMatches.length === 0 || topScore < 0.28) {
        return res.json({
          matched: false,
          model: 'all-MiniLM-L6-v2 (Neural Embeddings)',
          message: "The inquiry didn't match any selected resources",
          reason: `Semantic neural similarity score (${(topScore * 100).toFixed(1)}%) is below the relevance threshold (28%) for the selected resources.`,
          inquiry: cleanInquiry,
          topSimilarityScore: topScore,
          totalSourcesAnalyzed: parsedEntities.length
        });
      }

      // Filter matches with high semantic confidence (>= 0.25)
      const relevantMatches = semanticMatches.filter(m => m.score >= 0.25).slice(0, 5);

      return res.json({
        matched: true,
        inquiry: cleanInquiry,
        model: 'all-MiniLM-L6-v2 (Neural Embeddings)',
        semanticSimilarity: topScore,
        directAnswer: `Extracted via all-MiniLM semantic ranking (Peak similarity: ${(topScore * 100).toFixed(1)}%): ${relevantMatches.map(m => m.text).join(' ')}`,
        keyFindings: relevantMatches.map(m => `${m.text} [Neural Match: ${(m.score * 100).toFixed(1)}% | Source: ${m.item.title}]`),
        sourceBullets: relevantMatches.map(m => ({
          title: m.item.title,
          url: m.item.url,
          bullet: m.text,
          score: m.score,
          similarityPercent: `${(m.score * 100).toFixed(1)}%`,
          sentiment: m.item.sentiment
        })),
        consensusScore: avgScore,
        consensusLabel: avgLabel,
        totalSourcesAnalyzed: parsedEntities.length,
        topSharedEntities
      });
    }
  } catch (embedErr) {
    console.warn('[all-MiniLM-L6-v2 Fallback]', embedErr.message);
  }

  // 3. Deterministic NLP Semantic Matcher Fallback
  const stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
    'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
    'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'its',
    'itself', 'let\'s', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
    'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
    'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
    'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'were', 'weren\'t', 'what', 'when',
    'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'tell', 'show', 'give', 'list'
  ]);

  const inquiryWords = cleanInquiry
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  const matchingBullets = [];
  let totalMatches = 0;

  for (const ent of parsedEntities) {
    const fullText = `${ent.title} ${ent.content_snippet}`.toLowerCase();
    const matchesForEnt = inquiryWords.filter(w => fullText.includes(w));
    if (matchesForEnt.length > 0) {
      totalMatches += matchesForEnt.length;

      const sentences = (ent.content_snippet || '')
        .split(/(?<=[.?!])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

      const relevantSentences = sentences.filter(s => {
        const sLower = s.toLowerCase();
        return inquiryWords.some(w => sLower.includes(w));
      });

      const bestSentence = relevantSentences[0] || (ent.content_snippet || '').slice(0, 180);
      matchingBullets.push({
        title: ent.title,
        url: ent.url,
        bullet: bestSentence,
        matchingKeywords: matchesForEnt,
        sentiment: ent.sentiment_label,
        score: ent.sentiment_score
      });
    }
  }

  // Check relevance threshold
  if (inquiryWords.length > 0 && (totalMatches === 0 || matchingBullets.length === 0)) {
    return res.json({
      matched: false,
      message: "The inquiry didn't match any selected resources",
      reason: `None of the terms or concepts in your inquiry ("${cleanInquiry}") were identified in the crawled text of the ${parsedEntities.length} selected resource(s).`,
      inquiry: cleanInquiry,
      totalSourcesAnalyzed: parsedEntities.length
    });
  }

  return res.json({
    matched: true,
    inquiry: cleanInquiry,
    directAnswer: `Based on analysis across ${matchingBullets.length} matching resource(s): ${matchingBullets.map(b => b.bullet).join(' ')}`,
    keyFindings: matchingBullets.map(b => `${b.bullet} (Source: ${b.title})`),
    sourceBullets: matchingBullets,
    consensusScore: avgScore,
    consensusLabel: avgLabel,
    totalSourcesAnalyzed: parsedEntities.length,
    topSharedEntities
  });
});
