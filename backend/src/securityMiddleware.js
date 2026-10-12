import { db, SecurityLog, isMongoConnected } from './database.js';
import { uuidv4 } from './utils/uuid.js';

export function logSecurityIncident(ipAddress, eventType, details) {
  try {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const cleanIp = ipAddress || '127.0.0.1';

    if (isMongoConnected) {
      SecurityLog.create({
        _id: id,
        ip_address: cleanIp,
        event_type: eventType,
        details: String(details).slice(0, 500),
        timestamp: new Date(timestamp)
      }).catch(() => null);
    }

    db.prepare(`
      INSERT INTO security_logs (id, ip_address, event_type, details, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, cleanIp, eventType, String(details).slice(0, 500), timestamp);
  } catch (err) {
    console.error('[Security Logger Error]', err.message);
  }
}

const SQLI_PATTERNS = [
  /(\b(union(\s+all)?)\s+select\b)/i,
  /(\bselect\b.+\bfrom\b.+\bwhere\b)/i,
  /(\binsert\b.+\binto\b.+\bvalues\b)/i,
  /(\bdrop\s+table\b)/i,
  /(\bexec(\s+|\()+sp_)/i,
  /(;\s*delete\s+from)/i,
  /(\bor\s+1\s*=\s*1\b)/i,
  /('[\s]*or[\s]*'1'='1)/i
];

const TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e%2f/i,
  /%2e%2e\//i,
  /\.\.%2f/i,
  /%252e%252e/i
];

function checkString(val) {
  if (typeof val !== 'string') return null;
  for (const pat of SQLI_PATTERNS) {
    if (pat.test(val)) return { type: 'sqli_attempt', pattern: pat.toString(), sample: val.slice(0, 100) };
  }
  for (const pat of TRAVERSAL_PATTERNS) {
    if (pat.test(val)) return { type: 'traversal_attempt', pattern: pat.toString(), sample: val.slice(0, 100) };
  }
  return null;
}

const EXEMPT_KEYS = new Set(['password', 'confirmPassword', 'prompt', 'message', 'content']);

function scanObject(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of Object.keys(obj)) {
    if (EXEMPT_KEYS.has(key)) continue;

    const keyThreat = checkString(key);
    if (keyThreat) return keyThreat;

    const val = obj[key];
    if (typeof val === 'string') {
      const threat = checkString(val);
      if (threat) return threat;
    } else if (typeof val === 'object' && val !== null) {
      const nested = scanObject(val);
      if (nested) return nested;
    }
  }
  return null;
}

export function securityMiddleware(req, res, next) {
  // Exclude healthcheck & static resources
  if (req.path === '/health' || req.path === '/api/health' || req.path === '/favicon.ico') {
    return next();
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

  // 1. Scan URL and Query parameters safely
  let urlDecoded = req.url;
  try {
    urlDecoded = decodeURIComponent(req.url);
  } catch {
    urlDecoded = req.url;
  }

  // Check URL query parameters (excluding safe prompt/search query values)
  if (req.query && typeof req.query === 'object') {
    for (const [k, v] of Object.entries(req.query)) {
      if (k === 'q' || k === 'prompt') continue;
      const threat = checkString(String(v));
      if (threat) {
        logSecurityIncident(clientIp, threat.type, `Query param [${k}] detected: ${threat.sample}`);
        return res.status(403).json({ error: 'Forbidden: Security threat detected' });
      }
    }
  }

  // 2. Scan Request Body (exempting search prompt and password)
  if (req.body && typeof req.body === 'object') {
    const bodyThreat = scanObject(req.body);
    if (bodyThreat) {
      logSecurityIncident(clientIp, bodyThreat.type, `Body payload detected: ${bodyThreat.sample}`);
      return res.status(403).json({ error: 'Forbidden: Security threat detected in payload' });
    }
  }

  next();
}
