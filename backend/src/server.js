import './polyfill.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database.js';
import { startBackgroundTasks } from './tasks.js';
import { securityMiddleware } from './securityMiddleware.js';

import { authRouter } from './api/auth.js';
import { adminRouter } from './api/admin.js';
import { endpointsRouter } from './api/endpoints.js';
import { researchRouter } from './api/research.js';
import { aiRouter } from './api/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 1. Initialize Database & Run Migrations
await initDatabase();

// 2. Start Background Hourly Tasks
startBackgroundTasks();

// 3. Global Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Allow localhost, github.io, onrender.com, or any configured FRONTEND_URL
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('github.io') ||
      origin.includes('onrender.com') ||
      origin.includes('vercel.app') ||
      origin === FRONTEND_URL
    ) {
      return callback(null, true);
    }
    
    return callback(null, true); // Allow all origins for the public API gateway
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Security Middleware (SQLi & Path Traversal Scanner)
app.use(securityMiddleware);

// 5. Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Web Intelligence Cyber Gateway',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Web Intelligence Cyber Gateway',
    timestamp: new Date().toISOString()
  });
});


// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Web Intelligence Platform Gateway',
    version: '1.0.0',
    documentation: '/api/v1',
    endpoints: {
      crawls: '/api/v1/crawls',
      auth: '/api/v1/auth/me',
      research: '/api/v1/research/sessions',
      alerts: '/api/v1/alerts'
    }
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    api_root: '/api/v1',
    health: 'OK'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// 6. Mount API Routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/research', researchRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1', endpointsRouter);

// 7. Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.url}` });
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Gateway Error]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ 
    error: err.message || 'Internal server error occurred',
    code: err.code || 'GATEWAY_ERROR'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌐 Web Intelligence Node.js Gateway running on port ${PORT}`);
  console.log(`🛡️  Security Middleware Active`);
  console.log(`⚡ API Root: /api/v1 (Port ${PORT})`);
  console.log(`====================================================`);
});
