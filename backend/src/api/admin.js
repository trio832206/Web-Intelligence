import express from 'express';
import { db, User, SecurityLog, PendingRegistration, isMongoConnected } from '../database.js';
import { requireAdmin } from './auth.js';

export const adminRouter = express.Router();

// Apply requireAdmin to all admin routes
adminRouter.use(requireAdmin);

// GET /api/v1/admin/users
adminRouter.get('/users', async (req, res) => {
  if (isMongoConnected) {
    try {
      const mUsers = await User.find().sort({ created_at: -1 }).lean();
      if (mUsers && mUsers.length > 0) {
        return res.json({
          users: mUsers.map(u => ({
            id: u._id,
            email: u.email,
            phone: u.phone,
            date_of_birth: u.date_of_birth,
            role: u.role,
            premium_expires_at: u.premium_expires_at,
            created_at: u.created_at
          }))
        });
      }
    } catch (mErr) {
      console.warn('[MongoDB Atlas Admin Users Notice]', mErr.message);
    }
  }

  const users = db.prepare('SELECT id, email, phone, date_of_birth, role, premium_expires_at, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

// DELETE /api/v1/admin/users/:id
adminRouter.delete('/users/:id', async (req, res) => {
  const targetId = req.params.id;

  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Security policy: Administrator cannot delete their own active account' });
  }

  let existing = null;
  if (isMongoConnected) {
    try {
      existing = await User.findById(targetId);
      if (existing) {
        await User.deleteOne({ _id: targetId });
      }
    } catch {}
  }

  if (!existing) {
    existing = db.prepare('SELECT id, role FROM users WHERE id = ?').get(targetId);
  }

  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  res.json({ message: 'User deleted successfully', deletedId: targetId });
});

// POST /api/v1/admin/approve-premium/:id
adminRouter.post('/approve-premium/:id', async (req, res) => {
  const targetId = req.params.id;
  const { duration_days, action } = req.body || {};

  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Cannot modify your own administrator account' });
  }

  if (action === 'revoke') {
    if (isMongoConnected) {
      try { await User.updateOne({ _id: targetId }, { $set: { role: 'user', premium_expires_at: null } }); } catch (_) {}
    }
    db.prepare('UPDATE users SET role = ?, premium_expires_at = NULL WHERE id = ?').run('user', targetId);
    return res.json({ message: 'User premium subscription revoked', user_id: targetId, role: 'user' });
  }

  let expiresAt = null;
  if (duration_days && parseInt(duration_days, 10) > 0) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(duration_days, 10));
    expiresAt = d.toISOString();
  }

  // Update MongoDB if connected
  if (isMongoConnected) {
    try { 
      await User.updateOne(
        { _id: targetId }, 
        { $set: { role: 'premium', premium_expires_at: expiresAt ? new Date(expiresAt) : null } }
      ); 
    } catch (_) {}
  }

  // Update SQLite
  db.prepare('UPDATE users SET role = ?, premium_expires_at = ? WHERE id = ?').run('premium', expiresAt, targetId);
  res.json({ 
    message: 'User upgraded to premium successfully', 
    user_id: targetId,
    role: 'premium',
    premium_expires_at: expiresAt
  });
});

// GET /api/v1/admin/security-logs
adminRouter.get('/security-logs', async (req, res) => {
  if (isMongoConnected) {
    try {
      const mLogs = await SecurityLog.find().sort({ timestamp: -1 }).limit(100).lean();
      if (mLogs && mLogs.length > 0) {
        return res.json({
          logs: mLogs.map(l => ({
            id: l._id,
            ip_address: l.ip_address,
            event_type: l.event_type,
            details: l.details,
            timestamp: l.timestamp
          }))
        });
      }
    } catch (mErr) {
      console.warn('[MongoDB Atlas Admin Logs Notice]', mErr.message);
    }
  }

  const logs = db.prepare('SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 100').all();
  res.json({ logs });
});

// GET /api/v1/admin/pending-registrations
adminRouter.get('/pending-registrations', async (req, res) => {
  if (isMongoConnected) {
    try {
      const mPendings = await PendingRegistration.find({ status: 'pending' }).sort({ created_at: -1 }).lean();
      if (mPendings && mPendings.length > 0) {
        return res.json({
          pending: mPendings.map(p => ({
            id: p._id,
            email: p.email,
            phone: p.phone,
            date_of_birth: p.date_of_birth,
            created_at: p.created_at
          }))
        });
      }
    } catch (mErr) {
      console.warn('[MongoDB Atlas Pending Registrations Notice]', mErr.message);
    }
  }

  const pending = db.prepare('SELECT id, email, phone, date_of_birth, created_at FROM pending_registrations WHERE status = ? ORDER BY created_at DESC').all('pending');
  res.json({ pending });
});

// POST /api/v1/admin/approve-registration/:id
// Adds credentials to users database ONLY after confirmation by admin!
adminRouter.post('/approve-registration/:id', async (req, res) => {
  const pendingId = req.params.id;

  // Retrieve pending registration
  let pendingRecord = null;
  if (isMongoConnected) {
    try {
      pendingRecord = await PendingRegistration.findById(pendingId).lean();
    } catch {}
  }
  if (!pendingRecord) {
    pendingRecord = db.prepare('SELECT * FROM pending_registrations WHERE id = ?').get(pendingId);
  }

  if (!pendingRecord) {
    return res.status(404).json({ error: 'Pending registration request not found' });
  }

  const { email, hashed_password, date_of_birth, phone } = pendingRecord;
  const now = new Date().toISOString();

  // 1. Insert into users collection/table now (after confirmation!)
  if (isMongoConnected) {
    try {
      await User.create({
        _id: pendingId,
        email,
        hashed_password,
        role: 'user',
        date_of_birth: new Date(date_of_birth),
        phone,
        phone_verified: true,
        created_at: new Date(now)
      });
      // Mark or remove from pending
      await PendingRegistration.deleteOne({ _id: pendingId });
    } catch (mErr) {
      console.warn('[MongoDB Approve Registration Notice]', mErr.message);
    }
  }

  // 2. Insert into SQLite users table
  try {
    db.prepare(`
      INSERT INTO users (id, email, hashed_password, role, date_of_birth, phone, phone_verified, created_at)
      VALUES (?, ?, ?, 'user', ?, ?, 1, ?)
    `).run(pendingId, email, hashed_password, typeof date_of_birth === 'string' ? date_of_birth : new Date(date_of_birth).toISOString(), phone, now);
  } catch (err) {
    console.error('[SQLite Approve Error]', err.message);
  }

  // 3. Remove from SQLite pending_registrations
  db.prepare('DELETE FROM pending_registrations WHERE id = ?').run(pendingId);

  res.json({
    message: `Account for ${email} approved successfully and credentials activated in database.`,
    user_id: pendingId
  });
});

// POST /api/v1/admin/reject-registration/:id
adminRouter.post('/reject-registration/:id', async (req, res) => {
  const pendingId = req.params.id;

  if (isMongoConnected) {
    try {
      await PendingRegistration.deleteOne({ _id: pendingId });
    } catch {}
  }

  db.prepare('DELETE FROM pending_registrations WHERE id = ?').run(pendingId);

  res.json({ message: 'Registration request rejected and removed.', rejected_id: pendingId });
});
