# Web Intelligence Platform — Master Project Context

> **Last Updated**: October 2026  
> **Architecture**: Distributed MERN Stack (MongoDB Atlas / Express / React 19 / Node.js) with WebAssembly SQLite Local Sync & Classic Terminal Design System

---

## 1. Executive Summary

**Web Intelligence** is an investigative OSINT, multi-source web research, and automated data synthesis platform. Users submit research queries, investigative prompts, or direct target URLs. The platform autonomously discovers authoritative sources, executes polite yet stealth-resilient web crawling, parses HTML content, performs VADER sentiment scoring and Named Entity Recognition (NER), cross-correlates multi-source entities in dynamic knowledge graphs, and triggers automated alerting pipelines.

---

## 2. Platform Architecture & Service Topology

| Component | Technology | Address / Port | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend Client** | React 19 · Vite 5 · Lucide Icons | `http://localhost:5173` | Terminal aesthetic UI, multi-language (i18next), responsive layout, per-user themes |
| **Backend Gateway** | Node.js (ESM) · Express 4 | `http://localhost:8000` | Security middleware, REST API, crawler orchestrator, auth services |
| **Primary Database** | MongoDB Atlas Cluster | Replica Set URI in `.env` | Primary cloud persistence for users, jobs, entities, rules, logs |
| **Local Cache Engine** | WebAssembly SQLite (`sql.js`) | File / In-memory sync | Resilient local persistence, zero native compile dependencies, automatic schema migrations |
| **NLP Engine** | In-process VADER + Regex NER | Node.js runtime | Polarity scoring `[-1.0, 1.0]`, entity resolution, multi-document synthesis |
| **URL Discovery** | Gemini Flash + DDG | Node.js runtime | Prompt-to-URL query expansion with location targeting |

---

## 3. User Onboarding, Authentication & Authorization Policy

1. **Age Requirement**:
   - Users must be at least 18 years old to register (`date_of_birth` validated server-side).
2. **Administrator Verification Workflow**:
   - All self-registrations are saved into `pending_registrations`.
   - Accounts are not permitted to log in until explicitly reviewed, phone-verified, and approved by a super administrator in the Admin Panel (`/admin`).
   - Pending users see a friendly notice that review takes up to 24 hours with dedicated direct contact support: **7010371588** (SMS / WhatsApp).
3. **Session & Token Management**:
   - Authentication uses JSON Web Tokens (JWT) signed with `JWT_SECRET_KEY` expiring in **6 hours**.
   - Role-based route protection: standard users, premium users (unlimited crawl quotas), and administrators (`admin`).
4. **Per-User Theme Customization**:
   - Themes (`dark` CRT vs `light` White Paper Terminal) and phosphor accents (`green`, `cyan`, `amber`, `monochrome`, `crimson`) are stored individually per user ID in SQLite and MongoDB Atlas (`PATCH /api/v1/auth/preferences`).
   - The user's desired theme is restored immediately upon login and session refresh, ensuring personalized visual settings rather than a global default.

---

## 4. Visual Design System: Classic High-Contrast Terminal

- **Dark CRT Terminal Mode**: Phosphor glow, scanlines, deep black cards (`#0a0c10` / `#121721`), vibrant neon accents.
- **White Paper Terminal Mode**: Clean white paper aesthetic (`#f8fafc` / `#ffffff`), deep slate typography (`#090d16`), zero eye strain, full WCAG contrast.
- **Terminal Phosphor Accents**:
  - 🟢 **Green Phosphor**: VT100 / Matrix phosphor (`#00ff66` / `#047857`)
  - 🔷 **Cyan Terminal**: High-contrast cobalt telemetry (`#00f0ff` / `#0284c7`)
  - 🟠 **Amber CRT**: Vintage cathode-ray tube amber (`#ffb000` / `#b45309`)
  - ⚪ **Clean Monochrome**: High-legibility slate (`#f8fafc` / `#0f172a`)
  - 🔴 **Crimson Star**: Tactical phosphor (`#ff2a5f` / `#be123c`)
- **Cyber Boot Sequence**:
  - Full-screen kernel initialization animation (`CyberBootSequence.jsx`) rendered exclusively between authentication and dashboard entry.
- **Strict Readability**:
  - All backgrounds and borders leverage CSS variables (`var(--bg-card)`, `var(--bg-secondary)`, `var(--bg-input)`, `var(--border-glow)`). No hardcoded dark backgrounds in daylight mode.

---

## 5. Core Application Modules

### 5.1 Public Information Portal (`/about`)
- Unauthenticated landing page presenting platform features, security standards, and support channels.
- Contains no proprietary technology disclosures or stack-leak spoilers.

### 5.2 Investigative Crawl & Research Manager (`/` - Dashboard)
- **Prompt Mode**: Accepts user query (e.g. *"renewable energy subsidies in Europe"*), sets URL count (3, 5, 8), depth (1–3), and location targeting. Dispatches asynchronous multi-worker research session.
- **Manual Mode**: Direct single-URL crawler accepting valid `http://` or `https://` target links with configurable depth, stealth mode, and robots.txt compliance.
- **5-Stage Pipeline Tracking**: Visualizes Query Processing &rarr; Source Discovery &rarr; Content Extraction &rarr; Sentiment & Entity Analysis &rarr; Ready.
- **Recent Crawl Jobs**: Sortable job history with batch deletion, CSV export, and status indicators.

### 5.3 Data Fusion & Cross-Entity Resolution (`/data-fusion`)
- Resolves correlated entities extracted across multiple crawled pages.
- Dynamic HTML5 canvas renders an animated knowledge graph visualizing source nodes in outer orbit linked to correlated shared entity clusters at the center.
- Full theme-aware rendering matching user color profiles.

### 5.4 Synthesis & Crawl Jobs Archive (`/synthesis`)
- Left pane organizes research sessions in the **Crawl Jobs Archive** (`synthesis.sessionsTree`).
- Multi-source selector allows checking/unchecking specific crawled targets for LLM synthesis.
- Synthesis workbench generates comprehensive executive intelligence briefs, entity heatmaps, and sentiment distributions.

### 5.5 NLP & Text Analytics (`/nlp`)
- VADER sentiment polarity breakdown (Positive, Neutral, Negative).
- Named Entity distribution across Persons, Organizations, Locations, and Technical concepts.

### 5.6 Automated Alerting System (`/alerts`)
- Custom rule creation matching keywords and sentiment thresholds (`positive`, `negative`, `neutral`, `any`).
- Live notifications generated whenever crawled content matches active alert rules.

### 5.7 Administration & Security Audit (`/admin`)
- Restricted to users with `role: "admin"`.
- Pending registration review: Approve or reject user onboarding.
- User management: Role assignment (`user`, `premium`, `admin`) and account deletion.
- Security audit log viewer: Tracks IP addresses, failed authentication attempts, and sanitization events.

### 5.8 User Settings (`/settings`)
- Theme selection (Dark CRT vs White Paper Terminal).
- Terminal phosphor accent selection (Green, Cyan, Amber, Monochrome, Crimson).
- Multi-language switcher: English, French, Spanish, Tamil, Hindi.
- Self-service account deletion.

---

## 6. Directory Map

```
Web Intelligence/
├── project_context.md                ← Master project reference (this file)
├── README.md                         ← Setup and run instructions
├── backend/
│   ├── .env                          ← Configuration & secrets
│   ├── package.json
│   └── src/
│       ├── index.js                  ← Server bootstrapping
│       ├── server.js                 ← Express app & routing
│       ├── database.js               ← MongoDB connection, WASM SQLite sync, migrations
│       ├── securityMiddleware.js     ← Request sanitization & audit logging
│       ├── tasks.js                  ← Background maintenance
│       ├── models/                   ← Mongoose ODM Schemas (User, CrawlJob, etc.)
│       ├── api/                      ← Route controllers (auth, admin, endpoints, research)
│       ├── crawler/                  ← Crawling engine, header rotation, HTML parser
│       └── nlp/                      ← VADER sentiment and NER analyzers
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx                   ← Main router, navigation, boot sequence orchestration
        ├── index.css                 ← Design tokens, theme variables, scanline styling
        ├── App.css                   ← Component layout rules, grids, tables
        ├── context/
        │   └── ThemeContext.jsx      ← Per-user theme and accent persistence
        ├── components/
        │   ├── CrawlManager.jsx      ← Prompt & Manual URL crawl dispatcher
        │   ├── Dashboard.jsx         ← Metrics, charts, recent jobs table
        │   ├── CyberBootSequence.jsx ← Kernel initialization sequence
        │   └── PortalBackground.jsx  ← Canvas particle network background
        ├── pages/
        │   ├── About.jsx             ← Public overview
        │   ├── Home.jsx              ← Dashboard container
        │   ├── Login.jsx             ← User authentication
        │   ├── Register.jsx          ← User registration
        │   ├── MachineLearning.jsx   ← Synthesis & Crawl Jobs Archive
        │   ├── NLPAnalytics.jsx      ← Sentiment & entity metrics
        │   ├── DataFusion.jsx        ← Dynamic network graph & entity resolution
        │   ├── Alerts.jsx            ← Real-time alert rules & triggers
        │   ├── AdminPanel.jsx        ← Account approvals & security audit
        │   └── Settings.jsx          ← Visual themes, accents & language
        └── utils/
            └── api.js                ← Axios-like authenticated fetch wrapper
```

---

## 7. Operational Guidelines & Development Standards

1. **Theme Variable Compliance**:
   - Always reference CSS custom properties (`var(--bg-card)`, `var(--bg-secondary)`, `var(--bg-input)`, `var(--text-main)`, `var(--text-muted)`, `var(--border-glow)`) rather than hardcoding `#000`, `#fff`, or opaque `rgba()` values.
2. **No Hardware/GPU Throttling**:
   - Canvas animations and particle loops must run smoothly without aggressive frame-capping or artificial degradation for battery conservation.
3. **Data Integrity & Fallback**:
   - SQLite (`sql.js`) WASM engine serves as zero-downtime local persistence if MongoDB Atlas connection is unreachable.
4. **Public Surface Neutrality**:
   - Public copy, onboarding text, and error messages must remain professional and free of internal technology stack leaks.
