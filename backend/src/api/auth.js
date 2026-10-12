import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { uuidv4 } from '../utils/uuid.js';
import { db, User, PendingRegistration, isMongoConnected } from '../database.js';
import { sendSMS } from '../utils/sms.js';
import { logSecurityIncident } from '../securityMiddleware.js';

export const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'web-intelligence-super-secret-jwt-key-2026';
const JWT_EXPIRES_IN = '6h';

// Helper to generate JWT
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Authentication middleware
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
}

// Admin-only middleware
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
}

// POST /api/v1/auth/register
authRouter.post('/register', async (req, res) => {
  const { email, password, date_of_birth, phone } = req.body || {};
  // Basic validations
  if (!email || !password || !date_of_birth || !phone ||
      typeof email !== 'string' || typeof password !== 'string' || typeof date_of_birth !== 'string' || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Email, password, date_of_birth and phone are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Age verification (must be >= 18)
  const dobDate = new Date(date_of_birth);
  if (isNaN(dobDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date_of_birth format' });
  }
  const ageDifMs = Date.now() - dobDate.getTime();
  const ageDate = new Date(ageDifMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  if (age < 18) {
    return res.status(400).json({ error: 'You must be at least 18 years old to register' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();

  // Check existing email in users OR pending_registrations
  let existingEmail = null;
  if (isMongoConnected) {
    try { 
      existingEmail = await User.findOne({ email: cleanEmail }).lean() || 
                      await PendingRegistration.findOne({ email: cleanEmail }).lean(); 
    } catch {}
  }
  if (!existingEmail) {
    existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail) ||
                    db.prepare('SELECT id FROM pending_registrations WHERE email = ?').get(cleanEmail);
  }
  if (existingEmail) {
    return res.status(409).json({ error: 'An account or pending request with this email already exists' });
  }

  // Check existing phone in users OR pending_registrations
  let existingPhone = null;
  if (isMongoConnected) {
    try { 
      existingPhone = await User.findOne({ phone: cleanPhone }).lean() ||
                      await PendingRegistration.findOne({ phone: cleanPhone }).lean(); 
    } catch {}
  }
  if (!existingPhone) {
    existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(cleanPhone) ||
                    db.prepare('SELECT id FROM pending_registrations WHERE phone = ?').get(cleanPhone);
  }
  if (existingPhone) {
    return res.status(409).json({ error: 'An account or pending request with this phone number already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const id = uuidv4();
  const now = new Date().toISOString();

  // Save to MongoDB Atlas pending_registrations ONLY (not users)
  if (isMongoConnected) {
    try {
      await PendingRegistration.create({
        _id: id,
        email: cleanEmail,
        hashed_password: hash,
        date_of_birth: dobDate,
        phone: cleanPhone,
        status: 'pending',
        created_at: new Date(now)
      });
    } catch (mErr) {
      console.warn('[MongoDB Atlas Pending Register Notice]', mErr.message);
    }
  }

  // Save to SQLite pending_registrations ONLY (not users table)
  db.prepare(`
    INSERT INTO pending_registrations (id, email, hashed_password, date_of_birth, phone, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(id, cleanEmail, hash, dobDate.toISOString(), cleanPhone, now);

  // Return success message instructing user about 24h admin approval and contact
  res.status(201).json({
    message: 'Your registration request has been submitted. Your account will be verified and you will be able to login within 24 hours. For any issues faced, please contact 7010371588 on SMS or WhatsApp.',
    request_id: id,
    email: cleanEmail,
    contact_support: '7010371588'
  });
});

// POST /api/v1/auth/login
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Look up in MongoDB Atlas first, fallback to SQLite
  let user = null;
  if (isMongoConnected) {
    try {
      const mUser = await User.findOne({ email: cleanEmail }).lean();
      if (mUser) {
        user = {
          id: mUser._id,
          email: mUser.email,
          hashed_password: mUser.hashed_password,
          role: mUser.role,
          theme: mUser.theme || 'dark',
          accent: mUser.accent || 'green'
        };
      }
    } catch (mErr) {
      console.warn('[MongoDB Atlas Login Notice]', mErr.message);
    }
  }

  if (!user) {
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  }

  // Check if account is still awaiting admin approval
  if (!user) {
    let pendingUser = null;
    if (isMongoConnected) {
      try { pendingUser = await PendingRegistration.findOne({ email: cleanEmail }).lean(); } catch {}
    }
    if (!pendingUser) {
      pendingUser = db.prepare('SELECT * FROM pending_registrations WHERE email = ?').get(cleanEmail);
    }
    if (pendingUser) {
      return res.status(403).json({
        error: 'Your registration request is pending admin verification. Your account will be verified and you will be able to login within 24 hours. For urgent inquiries, please contact 7010371588 on SMS or WhatsApp.'
      });
    }
  }

  if (!user || !user.hashed_password || !bcrypt.compareSync(password, user.hashed_password)) {
    logSecurityIncident(clientIp, 'failed_login', `Failed login attempt for email: ${cleanEmail}`);
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Ensure user is also in SQLite cache if found in MongoDB
  const localUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (!localUser) {
    try {
      db.prepare(`
        INSERT INTO users (id, email, hashed_password, role, theme, accent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(user.id, user.email, user.hashed_password, user.role, user.theme || 'dark', user.accent || 'green', new Date().toISOString());
    } catch {}
  }

  const tokenUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    theme: user.theme || 'dark',
    accent: user.accent || 'green'
  };
  const token = generateToken(tokenUser);

  res.json({
    message: 'Login successful',
    token,
    user: tokenUser
  });
});

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, async (req, res) => {
  let user = null;
  if (isMongoConnected) {
    try {
      const mUser = await User.findById(req.user.id).lean();
      if (mUser) {
        user = {
          id: mUser._id,
          email: mUser.email,
          role: mUser.role,
          theme: mUser.theme || 'dark',
          accent: mUser.accent || 'green',
          created_at: mUser.created_at
        };
      }
    } catch {}
  }

  if (!user) {
    user = db.prepare('SELECT id, email, role, theme, accent, created_at FROM users WHERE id = ?').get(req.user.id);
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// PATCH /api/v1/auth/preferences (Save user's desired theme & accent)
authRouter.patch('/preferences', requireAuth, async (req, res) => {
  const { theme, accent } = req.body || {};

  const updates = [];
  const params = [];

  if (theme && ['dark', 'light'].includes(theme)) {
    updates.push('theme = ?');
    params.push(theme);
  }
  if (accent && typeof accent === 'string') {
    updates.push('accent = ?');
    params.push(accent.slice(0, 32));
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid preferences provided' });
  }

  // Update in SQLite
  params.push(req.user.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  // Update in MongoDB
  if (isMongoConnected) {
    try {
      const mongoUpdate = {};
      if (theme) mongoUpdate.theme = theme;
      if (accent) mongoUpdate.accent = accent;
      await User.updateOne({ _id: req.user.id }, { $set: mongoUpdate });
    } catch {}
  }

  // Fetch updated user
  const updated = db.prepare('SELECT id, email, role, theme, accent, created_at FROM users WHERE id = ?').get(req.user.id);

  res.json({
    message: 'Preferences updated successfully',
    user: updated
  });
});

// DELETE /api/v1/auth/delete-account
authRouter.delete('/delete-account', requireAuth, async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(400).json({ error: 'Security policy: Administrator accounts cannot be self-deleted' });
  }

  if (isMongoConnected) {
    try {
      await User.deleteOne({ _id: req.user.id });
    } catch {}
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.json({ message: 'Account deleted successfully' });
});

// Helper to resolve redirect URI dynamically if not explicitly specified
function getOAuthRedirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI || process.env.OAUTH_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI || process.env.OAUTH_REDIRECT_URI;
  }
  const host = req.get('host') || 'localhost:8000';
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${proto}://${host}/api/v1/auth/oauth/google/callback`;
}

// GET /api/v1/auth/oauth/google
authRouter.get('/oauth/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getOAuthRedirectUri(req);

  if (!clientId) {
    // Return friendly status indicating credentials needed in .env or provide mock login
    return res.json({
      configured: false,
      message: 'GOOGLE_CLIENT_ID not configured in backend/.env. Use email/password authentication or configure Google OAuth credentials in backend/.env.'
    });
  }

  const scope = encodeURIComponent('openid profile email');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&access_type=offline`;
  res.redirect(googleAuthUrl);
});

// GET /api/v1/auth/oauth/google/callback
authRouter.get('/oauth/google/callback', async (req, res) => {
  const { code } = req.query;
  // Auto-detect frontend URL (supports GitHub Pages, custom domain or env override)
  let frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    const origin = req.get('origin') || req.get('referer');
    if (origin && (origin.includes('github.io') || origin.includes('localhost'))) {
      const u = new URL(origin);
      frontendUrl = u.origin + (u.pathname.startsWith('/Web-Intelligence') ? '/Web-Intelligence' : '');
    } else {
      frontendUrl = 'https://trio832206.github.io/Web-Intelligence';
    }
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=missing_code`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getOAuthRedirectUri(req);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) {
      return res.redirect(`${frontendUrl}/login?error=oauth_token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await userRes.json();

    if (!profile.email) {
      return res.redirect(`${frontendUrl}/login?error=oauth_no_email`);
    }

    const cleanEmail = profile.email.toLowerCase();
    let user = null;

    if (isMongoConnected) {
      try {
        const mUser = await User.findOne({ email: cleanEmail }).lean();
        if (mUser) {
          user = { id: mUser._id, email: mUser.email, role: mUser.role };
        }
      } catch {}
    }

    if (!user) {
      user = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get(cleanEmail);
    }

    if (!user) {
      const id = uuidv4();
      const salt = bcrypt.genSaltSync(10);
      const dummyHash = bcrypt.hashSync(uuidv4(), salt);
      const now = new Date().toISOString();

      if (isMongoConnected) {
        try {
          await User.create({
            _id: id,
            email: cleanEmail,
            hashed_password: dummyHash,
            role: 'user',
            created_at: new Date(now)
          });
        } catch {}
      }

      db.prepare(`
        INSERT INTO users (id, email, hashed_password, role, created_at)
        VALUES (?, ?, ?, 'user', ?)
      `).run(id, cleanEmail, dummyHash, now);

      user = { id, email: cleanEmail, role: 'user' };
    }

    const jwtToken = generateToken(user);
    res.redirect(`${frontendUrl}/oauth/callback?token=${jwtToken}`);
  } catch (err) {
    console.error('[OAuth Callback Error]', err);
    res.redirect(`${frontendUrl}/login?error=oauth_internal_error`);
  }
});

// POST /api/v1/auth/verify-phone
authRouter.post('/verify-phone', async (req, res) => {
  const { phone, otp } = req.body || {};
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const cleanPhone = String(phone).trim();
  const cleanOtp = String(otp).trim();

  // Retrieve OTP record
  const record = db.prepare('SELECT otp, expires_at FROM phone_verifications WHERE phone = ?').get(cleanPhone);
  if (!record) {
    return res.status(400).json({ error: 'No verification request found for this number. Please register again.' });
  }
  if (new Date(record.expires_at) < new Date()) {
    db.prepare('DELETE FROM phone_verifications WHERE phone = ?').run(cleanPhone);
    return res.status(400).json({ error: 'Verification code has expired. Please register again.' });
  }
  if (record.otp !== cleanOtp) {
    return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
  }

  // Look up user by phone
  const userRecord = db.prepare('SELECT id, email, role FROM users WHERE phone = ?').get(cleanPhone);
  if (!userRecord) {
    return res.status(400).json({ error: 'User not found for this phone number.' });
  }

  // Mark phone verified in SQLite
  db.prepare('UPDATE users SET phone_verified = 1 WHERE phone = ?').run(cleanPhone);

  // Also update MongoDB if connected
  if (isMongoConnected) {
    try { await User.updateOne({ _id: userRecord.id }, { $set: { phone_verified: true } }); } catch (_) {}
  }

  // Delete used OTP record
  db.prepare('DELETE FROM phone_verifications WHERE phone = ?').run(cleanPhone);

  // Issue JWT
  const token = generateToken(userRecord);
  res.json({ message: 'Phone verified successfully. Welcome!', token, user: userRecord });
});
