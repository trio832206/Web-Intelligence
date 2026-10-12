# Web Intelligence Platform — Cyber OSINT Gateway

> Built with **Node.js** (v22+) and **React** (Vite), featuring deep neon cyber glassmorphism, autonomous crawler scouts, VADER sentiment & NER analytics, cross-source research synthesis, interactive knowledge graph data fusion, and Bayek of Siwa AI guardian.

---

## 🚀 Quick Start

### Start Both Backend & Frontend (One Command)

From the `frontend` directory, start both servers concurrently:

```bash
cd frontend
npm run start:all
```

- **Frontend**: `http://localhost:5173`
- **Backend**:  `http://localhost:8000` (Health check: `http://localhost:8000/health`)

---

### Alternative: Start Separately

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 🔐 Default Administrator Clearance

On first startup, the database automatically provisions the default administrator account:

- **Email**: `admin@webintelligence.local`
- **Password**: `Admin@123`
- **Role**: `admin`

You can also enlist new operative accounts at `/register`.

---

## ⚙️ Environment Configuration (`backend/.env`)

| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `PORT` | Node.js Gateway HTTP port | `8000` |
| `JWT_SECRET_KEY` | HS256 JWT encryption secret | Configured |
| `FRONTEND_URL` | Client origin for CORS | `http://localhost:5173` |
| `DEFAULT_ADMIN_EMAIL` | Auto-seeded admin email | `admin@webintelligence.local` |
| `DEFAULT_ADMIN_PASSWORD` | Auto-seeded admin password | `Admin@123` |
| `GEMINI_API_KEY` | Optional: Gemini 2.5 Flash for prompt expansion & Bayek chat | Built-in DuckDuckGo real search & Medjay heuristic fallback |
| `GOOGLE_CLIENT_ID` | Optional: Google OAuth 2.0 Client ID | Email/password standard auth |
| `GOOGLE_CLIENT_SECRET` | Optional: Google OAuth 2.0 Client Secret | Email/password standard auth |
| `PROXY_LIST` | Optional: Comma-separated HTTP/HTTPS proxy URLs | Direct evasive stealth connection |

---

## 🌐 Features & Navigation

1. **Telemetry Dashboard (`/`)**: Real-time HUD, active crawl streams, indexed entities count, success rate, clickable URLs, and CSV intelligence export. Includes 04:00 AM daily reset logic.
2. **New Research Crawl (`/`)**: 
   - **Prompt Mode**: Enter natural language research queries with auto-detected timezone or GPS location targeting.
   - **5-Stage Pipeline**: Real-time tracking of Intent Decomposition → Target Identification → Anti-Bot Bypass → Data Extraction → NLP Synthesis.
   - **Manual Mode**: Target single URLs with recursion depth and stealth bypass options.
3. **Research Synthesis (`/synthesis`)**: Folder-like session tree archive, selective source checkboxes, bulk purge modal, and distillation of real cross-source consensus and key bullets.
4. **NLP Analytics (`/nlp`)**: Top 10 named entity frequency bar chart and per-page VADER sentiment polarity meter.
5. **Data Fusion Graph (`/data-fusion`)**: Topological network canvas visualizing source URLs and shared entity connections, plus cross-entity resolution tables.
6. **Alert Sentinel (`/alerts`)**: Configurable keyword and sentiment sentry rules with live alert notification streams.
7. **Admin Terminal (`/admin`)**: Clearance-protected operative registry and perimeter security threat log viewer.
8. **System Settings (`/settings`)**: Deep Neon Cyber Glass vs Light Cyber Hologram theme toggle, 5-language localization (EN, FR, ES, TA, HI), and danger zone.
9. **Bayek of Siwa AI Guardian**: Corner medallion popup providing contextual platform tutoring with read-only page sight.
