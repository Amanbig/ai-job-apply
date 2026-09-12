# AI Job Application Tracker & Career Optimization Pipeline

An enterprise-grade, data-driven career optimization pipeline and application tracking dashboard powered by **Google Cloud & Google Gemini GenAI**, built for the **Google Code Kitchen** challenge.

![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run%20%7C%20Gemini%202.5-4285F4?logo=google-cloud)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![React](https://img.shields.io/badge/React%2018-Vite%20%2B%20Tailwind-61DAFB?logo=react)
![Security](https://img.shields.io/badge/Security-Refresh%20Tokens%20%7C%20HTTP--Only%20Cookies%20%7C%20BCrypt-22c55e)
![Docker](https://img.shields.io/badge/Docker-Multi--Stage%20Alpine-2496ED?logo=docker)

---

## 🌟 Executive Summary & Evaluation Fit

Candidate application management today is fragmented, slow, and repetitive. Generic generative tools produce robotic cover letters that fail modern ATS filters and sound nothing like the applicant.

This system delivers an end-to-end career optimization pipeline meeting all challenge requirements:

1. **Authenticated Candidate Dashboard**: A 4-stage Kanban pipeline (`Applied`, `Interview`, `Offer`, `Reject`) logging company, role, application date, salary offers, notes, and full status transition audit trails (`status_transition_logs`).
2. **Context-Informed RAG AI Draft Studio**: Dynamic generation of tailored cover letters and follow-up emails using **Few-Shot In-Context Memory**. The engine dynamically pulls the candidate's past accepted drafts to mirror voice, tone, and quantified impact metrics.
3. **Automated Scheduled Nudge Engine**: A background cron worker (`node-cron`) continuously auditing application dormancy (e.g. applications in `Applied` stage for $\ge 7$ days without response), interview preparation schedules, and offer decision deadlines.
4. **Evaluation Ingestion Hub**: Seamless bulk parsing and persistence for both required evaluation CSV schemas:
   - **Job Postings**: `<id>, <from>, <to>, <type>, <description>`
   - **Associated Drafts**: `<id>, <jobId>, <type>, <contents>, <status>`
5. **Robust Security & Refresh Token Architecture**:
   - Short-lived Access Tokens (15 minutes) + Long-lived Refresh Tokens (7 days) with **automatic token rotation**.
   - Dual authentication transport: **Secure HTTP-only cookies** for web browser clients + **Bearer JWT token** header support for headless evaluation CLI/curl test runners.
   - Zero unauthenticated dashboard access: Unauthenticated visitors are routed to a secure Landing Gateway.
6. **Unified Containerization & Production Build**:
   - Multi-stage Alpine Dockerfile building the Vite React frontend and Express TypeScript backend into a unified image that serves static SPA assets and REST APIs on port 5000.
7. **Adaptive Light & Dark Mode**: Persistent theme context with instant switching and W3C `color-scheme` compliance across select inputs and modals.
8. **Resilient Google Gemini Cascade**:
   - Primary: `gemini-2.5-flash` / `gemini-2.0-flash`
   - Fallback: `gemini-1.5-flash` / `gemini-1.5-pro`
   - **Offline Heuristic Synthesizer**: Guarantees 100% evaluation completion even without an API key or when offline.

---

## 🏗️ System Architecture

```
                                 ┌─────────────────────────────────────────────────────────┐
                                 │                   Client Layer                          │
                                 │  • React 18 + Vite + TailwindCSS SPA                    │
                                 │  • ThemeContext (Dark / Light Mode)                     │
                                 │  • AuthContext (Silent Token Refresh Interceptor)       │
                                 │  • Kanban Board │ AI Studio │ Nudge Center │ Ingestion  │
                                 └────────────────────────────┬────────────────────────────┘
                                                              │
                                     HTTP-Only Cookies (Browser) OR Authorization: Bearer (CLI)
                                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               Express TypeScript Backend Service (Port 5000)                             │
│                                                                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────┐  │
│  │ Auth & Refresh Tokens  │  │ Application Pipeline   │  │ Few-Shot RAG AI Studio │  │ Ingestion Hub  │  │
│  │ • 15m Access JWT       │  │ • 4 Stages Kanban      │  │ • Candidate Voice RAG  │  │ • Jobs CSV     │  │
│  │ • 7d Rotating Refresh  │  │ • State Machine Logs   │  │ • ATS Scoring Engine   │  │ • Drafts CSV   │  │
│  │ • BCrypt Salted Hash   │  │ • Audit History        │  │ • Tone Customization   │  │ • Validation   │  │
│  └────────────────────────┘  └────────────────────────┘  └────────────────────────┘  └────────────────┘  │
│                                                                                                          │
│  ┌────────────────────────────────────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │ Background Scheduled Nudge Cron Worker             │  │ Static SPA Asset Delivery Router           │  │
│  │ • Dormancy Detector (Applied >= 7 days)            │  │ • Serves compiled Vite HTML/JS/CSS         │  │
│  │ • Interview Prep & Offer Countdown                 │  │ • Client-side SPA wildcard fallback        │  │
│  └────────────────────────────────────────────────────┘  └────────────────────────────────────────────┘  │
└─────────────────────────────────┬──────────────────────────────────────────┬─────────────────────────────┘
                                  │                                          │
                                  ▼                                          ▼
                   ┌──────────────────────────────┐          ┌──────────────────────────────┐
                   │ Google Gemini GenAI Cascade  │          │ PostgreSQL 16 Database       │
                   │ • gemini-2.5-flash (Primary) │          │ • users & refresh_tokens     │
                   │ • gemini-2.0-flash (Fallback)│          │ • job_postings               │
                   │ • gemini-1.5-flash           │          │ • applications               │
                   │ • Offline Heuristic Engine   │          │ • status_transition_logs     │
                   └──────────────────────────────┘          │ • drafts & automated nudges  │
                                                             └──────────────────────────────┘
```

---

## 🔐 Security & Refresh Token Architecture

The platform enforces a multi-layered security model ensuring multi-tenant isolation and defense against session hijacking:

```
                  ┌────────────────────────┐
                  │ Client Request to API  │
                  └───────────┬────────────┘
                              │
                              ▼
                 Is Access Token valid (<15m)?
                   /                     \
                YES                       NO
                /                           \
   [Proceed to Controller]        Does valid Refresh Token exist?
                                    /                     \
                                 YES                       NO
                                 /                           \
                 [Issue new Access Token (15m)       [Return 401 Unauthorized]
                  Rotate Refresh Token in DB          [Redirect to Landing Gateway]
                  Retry original request silently]
```

### Key Security Features
1. **Short-Lived Access Tokens**: Signed JWT access tokens with a 15-minute lifespan to minimize the attack window if a token is intercepted.
2. **Persistent Refresh Tokens with Token Rotation**: Stored in PostgreSQL with user cascading relations. Whenever an access token is refreshed, the old refresh token is purged and a cryptographically secure 40-byte random hex token is issued.
3. **HTTP-Only Cookies (`accessToken` & `refreshToken`)**: Set with `HttpOnly: true`, `SameSite: Lax`, and `Secure` flags, insulating browser sessions from cross-site scripting (XSS) token exfiltration.
4. **Dual Authentication Support**:
   - **Browser Web App**: Authenticates seamlessly via HTTP-only cookies (`credentials: 'include'`).
   - **CLI / Curl / Automated Runners**: Evaluators can pass `-H "Authorization: Bearer <token>"`. The authentication middleware checks cookies first, then falls back to the `Authorization` header.
5. **No Unauthenticated Leaks**: Any unauthenticated attempt to query candidate endpoints (`/api/applications`, `/api/drafts`, `/api/nudges`, `/api/jobs`) returns `401 Unauthorized` with structured error codes (`TOKEN_EXPIRED`, `NO_TOKEN`).
6. **Pre-Seeded Candidate Account**:
   - **Email**: `demo@careeropt.ai`
   - **Password**: `demo123`
   *(Includes 12 pre-loaded job postings, 6 historical drafts, active pipeline applications, and scheduled nudges)*

---

## 🚀 Quick Start (One Command)

### Option A: Complete Docker Compose (Recommended)
Builds the unified frontend/backend container and brings up PostgreSQL 16:

```bash
# 1. Clone the repository and enter the directory
git clone https://github.com/Amanbig/ai-job-apply.git
cd ai-job-apply

# 2. Start PostgreSQL and the Unified Production Container
docker compose up --build -d
```

- **Unified Web Application**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **PostgreSQL Database**: Host port `5433` (mapped to container port `5432` to avoid host conflicts)

*(To stop the containers, run `docker compose down`)*

---

### Option B: Local Monorepo Development

#### Prerequisites
- Node.js $\ge 18$
- Docker (for PostgreSQL database)

#### Step-by-Step Local Setup

```bash
# 1. Start the PostgreSQL container
docker compose up -d postgres

# 2. Install root and package dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 3. Synchronize database schema and seed evaluation dataset
npm run db:push
npm run seed

# 4. Start concurrent development servers
npm run dev
```

- **Frontend Development Server**: [http://localhost:3000](http://localhost:3000) (Hot-reloading with Vite proxy to port 5000)
- **Backend API Service**: [http://localhost:5000](http://localhost:5000) (Hot-reloading with TSX)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 📊 Evaluation Schemas & Bulk Ingestion

The platform implements the exact schemas defined in the evaluation criteria.

### 1. Job Postings Schema
Accepted via CSV upload or JSON payload at `POST /api/jobs/ingest-csv`:

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | Integer / String | Unique job identifier | `1` |
| `from` | Date string | Posting publication date | `2026-06-01` |
| `to` | Date string | Posting deadline date | `2026-06-30` |
| `type` | String | Job category (`full-time`, `contract`, etc.) | `full-time` |
| `description` | String | Freeform job title, company, requirements | `Senior Backend Engineer - Python, Bengaluru` |

**Raw CSV Format:**
```csv
id, from, to, type, description
1, 2026-06-01, 2026-06-30, full-time, Senior Backend Engineer - Python, Bengaluru. Lead the design and scaling of distributed microservices with FastAPI and PostgreSQL.
2, 2026-06-10, 2026-07-10, contract, Data Platform Engineer - streaming pipelines, Remote. Build real-time telemetry pipelines using Apache Kafka and BigQuery.
```

---

### 2. Associated Drafts & Emails Schema
Accepted via CSV upload or JSON payload at `POST /api/jobs/ingest-drafts-csv`:

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | Integer / String | Unique draft identifier | `1` |
| `jobId` | Integer / String | Foreign key reference to Job Posting | `1` |
| `type` | String | `cover_letter` or `follow_up_email` | `cover_letter` |
| `contents` | String | Text content of the draft | `Dear Hiring Manager - I am applying for...` |
| `status` | String | `draft`, `sent`, or `reviewed` | `draft` |

**Raw CSV Format:**
```csv
id, jobId, type, contents, status
1, 1, cover_letter, "Dear Hiring Manager - I am applying for the Senior Backend Engineer position at TechCorp. With 6 years architecting high-scale Python microservices, I reduced query latency by 42%.", draft
2, 1, follow_up_email, "Following up on my application from June 12 for the Senior Backend Engineer role. I wanted to reiterate my enthusiasm for TechCorp's mission.", sent
```

---

## 🧪 Comprehensive `curl` Evaluation Test Suite

Below is a complete, copy-pasteable CLI test script to verify all requirements against a running backend (`http://localhost:5000`).

### 1. Authenticate (Login or Register)
```bash
# Login as the pre-seeded evaluation candidate:
LOGIN_RES=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@careeropt.ai", "password": "demo123"}')

ACCESS_TOKEN=$(node -e "console.log(JSON.parse(process.argv[1]).accessToken)" "$LOGIN_RES")
REFRESH_TOKEN=$(node -e "console.log(JSON.parse(process.argv[1]).refreshToken)" "$LOGIN_RES")

echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"
```

### 2. Verify Protected Profile & Isolation
```bash
curl -s -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3. Ingest Evaluation Job Postings CSV
```bash
curl -s -X POST http://localhost:5000/api/jobs/ingest-csv \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"csvContent": "id, from, to, type, description\n101, 2026-08-01, 2026-08-31, full-time, Staff Cloud Architect - GCP, Bengaluru\n102, 2026-08-05, 2026-09-05, contract, ML Infrastructure Engineer - PyTorch, Remote"}'
```

### 4. Ingest Evaluation Drafts CSV
```bash
curl -s -X POST http://localhost:5000/api/jobs/ingest-drafts-csv \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"csvContent": "id, jobId, type, contents, status\n201, 101, cover_letter, \"Dear Hiring Team - As an experienced GCP Architect with deep Kubernetes and Terraform experience...\", draft"}'
```

### 5. Transition Application Status with Audit Log
```bash
# Fetch active applications to get an application ID
APPS_RES=$(curl -s -X GET http://localhost:5000/api/applications \
  -H "Authorization: Bearer $ACCESS_TOKEN")
APP_ID=$(node -e "console.log(JSON.parse(process.argv[1])[0].id)" "$APPS_RES")

# Transition status from Applied -> Interview:
curl -s -X PATCH "http://localhost:5000/api/applications/$APP_ID/status" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "Interview", "note": "Passed technical screening; scheduled system design round."}'
```

### 6. Evaluate Scheduled Inactivity Nudges
```bash
curl -s -X POST http://localhost:5000/api/nudges/evaluate \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### 7. Generate Tailored Cover Letter with Few-Shot RAG Memory
```bash
curl -s -X POST http://localhost:5000/api/drafts/generate \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId": 1, "type": "cover_letter", "tone": "enthusiastic", "modelOverride": "gemini-2.5-flash"}'
```

### 8. Test Token Refresh & Rotation
```bash
REFRESH_RES=$(curl -s -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

NEW_ACCESS_TOKEN=$(node -e "console.log(JSON.parse(process.argv[1]).accessToken)" "$REFRESH_RES")
NEW_REFRESH_TOKEN=$(node -e "console.log(JSON.parse(process.argv[1]).refreshToken)" "$REFRESH_RES")

echo "Rotated New Access Token: $NEW_ACCESS_TOKEN"
echo "Rotated New Refresh Token: $NEW_REFRESH_TOKEN"
```

### 9. Logout & Session Revocation
```bash
curl -s -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$NEW_REFRESH_TOKEN\"}"
```

---

## 🧠 AI Engine & Few-Shot In-Context Memory

The GenAI pipeline solves the core flaw of typical LLM career assistants—impersonal, boilerplate text.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        In-Context RAG Memory Feed                      │
│                                                                        │
│  1. Candidate Historical Drafts:                                       │
│     • Past approved cover letters & follow-up emails                   │
│     • Extracts applicant's quantified metrics & career achievements    │
│     • Infers personal vocabulary, sentence rhythm, and voice           │
│                                                                        │
│  2. Target Job Description:                                            │
│     • Parsed tech stack, seniority, required capabilities              │
│                                                                        │
│  3. Model Prompt Construction:                                         │
│     • Few-shot style exemplars                                         │
│     • Anti-hallucination constraints                                   │
│     • ATS alignment scoring and tailored paragraph synthesis           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌──────────────────────────────────────────────────────────┐
       │             Google Gemini API Cascade Router             │
       │                                                          │
       │  Step 1: Try gemini-2.5-flash                            │
       │     └─► [Success: Returns tailored letter + ATS score]   │
       │  Step 2: On rate limit / deprecation, cascade to 2.0     │
       │     └─► [Fallback: gemini-2.0-flash / 1.5-flash]         │
       │  Step 3: Offline Heuristic Engine                        │
       │     └─► [Guaranteed fallback if offline or no API key]   │
       └──────────────────────────────────────────────────────────┘
```

---

## 🎨 User Interface & Experience Features

- **Landing Gateway**: Unauthenticated visitors are presented with a modern hero portal with secure Sign In and Create Account options. Direct unauthenticated dashboard access is blocked.
- **Persistent Theme Switcher (Dark / Light)**:
  - Toggle between dark slate (`bg-slate-950`) and crisp light (`bg-slate-50`) modes.
  - Native select dropdowns styled with W3C `color-scheme` to eliminate white background glitches on dark mode dropdowns across all browsers.
- **Interactive 4-Stage Kanban Board**:
  - Full-width layout spanning the entire viewport.
  - Quick-transition dropdowns on each card to transition between `Applied`, `Interview`, `Offer`, and `Reject`.
  - Search filter and status pills for fast application indexing.
- **Log Application Modal**:
  - Add new applications with target company, role, application date, job type, salary offer, and initial notes.
- **Few-Shot AI Draft Studio**:
  - Side-by-side view showing the active job description and candidate historical memory feed.
  - Live tone selection (`professional`, `enthusiastic`, `concise`, `executive`).
  - ATS compatibility score meter, word count gauge, and copy-to-clipboard actions.
- **Scheduled Nudge Center**:
  - Inactivity alerts for stagnant applications ($\ge 7$ days in `Applied`).
  - Actionable buttons: *Review Draft*, *Mark Done*, *Dismiss*.
- **Evaluation Ingestion Hub**:
  - Interactive paste area for raw CSV strings.
  - Real-time tabular preview before database ingestion.

---

## ☁️ Google Cloud Deployment (Cloud Run)

The application is containerized and ready for single-command deployment to **Google Cloud Run**:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

# 2. Build and deploy the unified container to Cloud Run
gcloud run deploy ai-job-tracker \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 5000 \
  --set-env-vars DATABASE_URL="postgresql://user:pass@cloudsql-ip:5432/ai_job_tracker?schema=public",JWT_SECRET="production_secret_key",GEMINI_API_KEY="AIzaSy..."
```

---

## 📂 Project Structure

```
ai_job/
├── Dockerfile                  # Multi-stage production container (Vite build + TS build + Alpine runner)
├── docker-compose.yml          # Orchestrates PostgreSQL 16 (port 5433) and unified app (port 5000)
├── .dockerignore               # Optimized Docker context exclusions
├── .gitignore                  # Git secrets, node_modules, and build artifact exclusions
├── .env.example                # Root environment variables reference
├── package.json                # Root monorepo orchestration scripts
├── README.md                   # System documentation & evaluation guide
│
├── backend/                    # Express + TypeScript + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL schema (users, refresh_tokens, job_postings, applications...)
│   │   └── seed.ts             # Evaluation datasets seed script (demo user, 12 jobs, 6 drafts)
│   ├── src/
│   │   ├── config/             # Prisma client & Google Gemini GenAI client
│   │   ├── middleware/         # requireAuth (Cookie + Bearer JWT + Refresh detection)
│   │   ├── routes/             # auth, applications, jobs, drafts, nudges, analytics
│   │   ├── services/           # gemini.service.ts, nudge.service.ts
│   │   └── index.ts            # Server entry point + static frontend SPA asset router
│   └── package.json
│
├── frontend/                   # React 18 + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/         # KanbanBoard, AIDraftStudio, NudgeCenter, IngestionHub, Navbar...
│   │   ├── context/            # AuthContext (with silent refresh), ThemeContext (dark/light)
│   │   ├── services/           # api.ts (fetchWithAuth interceptor for token rotation)
│   │   ├── types/              # TypeScript interface contracts
│   │   ├── App.tsx             # Main dashboard layout
│   │   └── index.css           # Global theme variables & custom dropdown styling
│   └── vite.config.ts          # Vite build config with /api development proxy
│
└── data/                       # Sample CSV files for testing
    ├── sample_job_postings.csv
    └── sample_drafts.csv
```

---

## 🛡️ License

MIT License. Developed for the Google Code Kitchen 2026 Challenge.
