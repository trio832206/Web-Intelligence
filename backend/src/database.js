import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import initSqlJs from 'sql.js';

// Import & Re-export Mongoose Models for MERN architecture
import { CrawlJob } from './models/CrawlJob.js';
import { ExtractedEntity } from './models/ExtractedEntity.js';
import { User } from './models/User.js';
import { AlertRule } from './models/AlertRule.js';
import { AlertNotification } from './models/AlertNotification.js';
import { SecurityLog } from './models/SecurityLog.js';
import { PendingRegistration } from './models/PendingRegistration.js';

export { CrawlJob, ExtractedEntity, User, AlertRule, AlertNotification, SecurityLog, PendingRegistration };

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'web_intelligence.db');

// Initialize WebAssembly SQLite (Zero native C++ bindings, 100% portable, never segfaults)
const SQL = await initSqlJs();
let rawDb;

if (fs.existsSync(dbPath)) {
  try {
    const fileBuffer = fs.readFileSync(dbPath);
    rawDb = new SQL.Database(fileBuffer);
  } catch (err) {
    console.warn('[DB Notice] Re-initializing database file:', err.message);
    rawDb = new SQL.Database();
  }
} else {
  rawDb = new SQL.Database();
}

function persistToDisk() {
  try {
    const data = rawDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    console.error('[DB Persist Error]', err.message);
  }
}

// Wrapper to provide standard synchronous db.prepare().all(), get(), run(), exec()
export const db = {
  prepare(sql) {
    return {
      run(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        rawDb.run(sql, flatParams);
        persistToDisk();
        return { changes: rawDb.getRowsModified() };
      },
      get(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = rawDb.prepare(sql);
        stmt.bind(flatParams);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = rawDb.prepare(sql);
        stmt.bind(flatParams);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  },
  exec(sql) {
    rawDb.run(sql);
    persistToDisk();
  }
};

export { mongoose };
export let isMongoConnected = false;
export function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

export async function connectMongoDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('[MERN Stack Notice] MONGODB_URI not set. Running on local WASM SQLite engine.');
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000
    });
    isMongoConnected = true;
    console.log(`[MERN Stack] 🍃 Connected to MongoDB cluster: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    // Create collections in MongoDB Atlas if they do not exist
    await Promise.allSettled([
      User.createCollection(),
      CrawlJob.createCollection(),
      ExtractedEntity.createCollection(),
      AlertRule.createCollection(),
      AlertNotification.createCollection(),
      SecurityLog.createCollection(),
      PendingRegistration.createCollection()
    ]);

    // Ensure Indexes
    await Promise.allSettled([
      User.syncIndexes(),
      CrawlJob.syncIndexes(),
      ExtractedEntity.syncIndexes(),
      AlertRule.syncIndexes(),
      AlertNotification.syncIndexes(),
      SecurityLog.syncIndexes(),
      PendingRegistration.syncIndexes()
    ]);

    // Seed master administrator account into MongoDB Atlas
    await seedMongoAdmin();

    // Initial sync of existing records from SQLite to MongoDB Atlas
    await syncSqliteToMongo();
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[MERN Stack Notice] MongoDB cluster connection deferred (${err.message}). Local hybrid engine active.`);
  }
}

async function seedMongoAdmin() {
  if (!isMongoConnected) return;
  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@webintelligence.local').toLowerCase();
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';

  try {
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(adminPassword, salt);
      await User.create({
        _id: 'admin-user-0001-master',
        email: adminEmail,
        hashed_password: hash,
        role: 'admin',
        created_at: new Date()
      });
      console.log(`[MongoDB Atlas] 🛡️ Seeded master administrator: ${adminEmail}`);
    }
  } catch (err) {
    console.warn('[MongoDB Atlas Admin Seed Warning]', err.message);
  }
}

async function syncSqliteToMongo() {
  if (!isMongoConnected) return;
  try {
    // 1. Users
    const users = db.prepare('SELECT * FROM users').all();
    for (const u of users) {
      await User.updateOne(
        { _id: u.id },
        { $set: { email: u.email.toLowerCase(), hashed_password: u.hashed_password, role: u.role, created_at: new Date(u.created_at) } },
        { upsert: true }
      );
    }

    // 2. Crawl Jobs
    const jobs = db.prepare('SELECT * FROM crawl_jobs').all();
    for (const j of jobs) {
      await CrawlJob.updateOne(
        { _id: j.id },
        { $set: {
          url: j.url,
          depth: j.depth,
          status: j.status,
          error_message: j.error_message,
          session_id: j.session_id,
          research_prompt: j.research_prompt,
          created_at: new Date(j.created_at)
        } },
        { upsert: true }
      );
    }

    // 3. Extracted Entities
    const entities = db.prepare('SELECT * FROM extracted_entities').all();
    for (const e of entities) {
      let tags = [];
      try {
        tags = JSON.parse(e.named_entities || '[]');
      } catch {}
      await ExtractedEntity.updateOne(
        { _id: e.id },
        { $set: {
          job_id: e.job_id,
          title: e.title,
          url: e.url,
          content_snippet: e.content_snippet,
          sentiment_score: e.sentiment_score,
          sentiment_label: e.sentiment_label,
          named_entities: Array.isArray(tags) ? tags : [],
          extracted_at: new Date(e.extracted_at)
        } },
        { upsert: true }
      );
    }

    // 4. Alert Rules
    const rules = db.prepare('SELECT * FROM alert_rules').all();
    for (const r of rules) {
      await AlertRule.updateOne(
        { _id: r.id },
        { $set: { user_id: r.user_id, keyword: r.keyword, condition: r.condition, created_at: new Date(r.created_at) } },
        { upsert: true }
      );
    }

    // 5. Alert Notifications
    const notifications = db.prepare('SELECT * FROM alert_notifications').all();
    for (const n of notifications) {
      await AlertNotification.updateOne(
        { _id: n.id },
        { $set: { user_id: n.user_id, rule_id: n.rule_id, message: n.message, url: n.url, created_at: new Date(n.created_at) } },
        { upsert: true }
      );
    }

    // 6. Security Logs
    const logs = db.prepare('SELECT * FROM security_logs').all();
    for (const l of logs) {
      await SecurityLog.updateOne(
        { _id: l.id },
        { $set: { ip_address: l.ip_address, event_type: l.event_type, details: l.details, timestamp: new Date(l.timestamp) } },
        { upsert: true }
      );
    }
    console.log('[MongoDB Atlas] 🔄 Initial collection sync completed successfully.');
  } catch (err) {
    console.warn('[MongoDB Atlas Sync Warning]', err.message);
  }
}

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS crawl_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      url TEXT NOT NULL,
      depth INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      session_id TEXT,
      research_prompt TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS extracted_entities (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      content_snippet TEXT,
      sentiment_score REAL,
      sentiment_label TEXT,
      named_entities TEXT,
      extracted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      date_of_birth TEXT,
      phone TEXT UNIQUE,
      phone_verified INTEGER DEFAULT 0,
      premium_expires_at TEXT,
      theme TEXT DEFAULT 'dark',
      accent TEXT DEFAULT 'green',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_registrations (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS phone_verifications (
        phone TEXT PRIMARY KEY,
        otp TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
    CREATE TABLE IF NOT EXISTS alert_rules (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      keyword TEXT NOT NULL,
      condition TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alert_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      rule_id TEXT,
      message TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS security_logs (
      id TEXT PRIMARY KEY,
      ip_address TEXT,
      event_type TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL
    );
  `);
  migrateDatabase();
  seedDefaultAdmin();
}

// Ensure schema is created immediately
initSchema();

export async function initDatabase() {
  await connectMongoDB();
}

function migrateDatabase() {
  const tableColumns = {
    users: {
      id: 'TEXT PRIMARY KEY',
      email: 'TEXT UNIQUE NOT NULL',
      hashed_password: 'TEXT NOT NULL',
      role: 'TEXT DEFAULT "user"',
      date_of_birth: 'TEXT',
      phone: 'TEXT',
      phone_verified: 'INTEGER DEFAULT 0',
      premium_expires_at: 'TEXT',
      theme: 'TEXT DEFAULT "dark"',
      accent: 'TEXT DEFAULT "green"',
      created_at: 'TEXT NOT NULL'
    },
    crawl_jobs: {
      id: 'TEXT PRIMARY KEY',
      user_id: 'TEXT',
      url: 'TEXT NOT NULL DEFAULT ""',
      depth: 'INTEGER DEFAULT 1',
      status: 'TEXT DEFAULT "pending"',
      error_message: 'TEXT',
      session_id: 'TEXT',
      research_prompt: 'TEXT',
      created_at: 'TEXT DEFAULT ""'
    },
    extracted_entities: {
      id: 'TEXT PRIMARY KEY',
      job_id: 'TEXT NOT NULL DEFAULT ""',
      title: 'TEXT NOT NULL DEFAULT ""',
      url: 'TEXT NOT NULL DEFAULT ""',
      content_snippet: 'TEXT',
      sentiment_score: 'REAL',
      sentiment_label: 'TEXT',
      named_entities: 'TEXT',
      extracted_at: 'TEXT DEFAULT ""'
    },
    pending_registrations: {
      id: 'TEXT PRIMARY KEY',
      email: 'TEXT UNIQUE NOT NULL',
      hashed_password: 'TEXT NOT NULL',
      date_of_birth: 'TEXT NOT NULL',
      phone: 'TEXT UNIQUE NOT NULL',
      status: 'TEXT DEFAULT "pending"',
      created_at: 'TEXT NOT NULL'
    }
  };

  for (const [table, expectedCols] of Object.entries(tableColumns)) {
    const existing = db.prepare(`PRAGMA table_info(${table})`).all();
    const existingColNames = new Set(existing.map(c => c.name));

    for (const [colName, colDef] of Object.entries(expectedCols)) {
      if (!existingColNames.has(colName)) {
        try {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${colName} ${colDef};`);
        } catch {
          // ignore
        }
      }
    }
  }
}

function seedDefaultAdmin() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@webintelligence.local';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!user) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPassword, salt);
    const id = 'admin-user-0001-master';
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, hashed_password, role, created_at)
      VALUES (?, ?, ?, 'admin', ?)
    `).run(id, adminEmail, hash, now);
    console.log(`[DB] Seeded default administrator account: ${adminEmail}`);
  }
}
