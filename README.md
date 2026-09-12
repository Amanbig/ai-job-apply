# AI Job Application Tracker & Career Optimization Pipeline

An enterprise-grade career optimization pipeline and application tracking dashboard powered by **Google Cloud & Google Gemini GenAI**, built for the **Google Code Kitchen** challenge.

![Architecture](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run%20%7C%20Gemini%202.5-4285F4?logo=google-cloud)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![React](https://img.shields.io/badge/React%20%2B%20Vite-18-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss)
![Security](https://img.shields.io/badge/Security-JWT%20Bearer%20%7C%20BCrypt-22c55e)

---

## 🌟 Core Highlights & Problem Fit

- **Strict JWT Bearer Authentication & User Isolation**: Unauthenticated users are met with a secure Landing Gateway. Private applications, state transitions, and tailored drafts are strictly isolated per authenticated user ID.
- **Persistent 4-Phase Pipeline Board**: Log and transition applications across `Applied`, `Interview`, `Offer`, and `Reject` with persistent state transition logs and full audit histories.
- **Context-Informed RAG AI Draft Studio**: Synthesizes highly tailored cover letters and precise follow-up emails. Dynamically retrieves candidate historical drafts (few-shot in-context memory) to mirror personal voice, tone, and quantified accomplishments.
- **Automated Scheduled Nudge Engine**: Background cron scheduler detecting inactivity (e.g. applications in `Applied` stage for $\ge 7$ days without response), scheduling interview prep alerts, and reminding users of offer negotiation deadlines.
- **Exact Evaluation Schema Ingestion Engine**:
  - Job Postings: `<id>, <from>, <to>, <type>, <description>`
  - Drafts & Emails: `<id>, <jobId>, <type>, <contents>, <status>`
- **Future-Proof Google GenAI Cascade**:
  - Primary: `gemini-2.5-flash` / `gemini-2.0-flash`
  - Fallback: `gemini-1.5-flash` / `gemini-1.5-pro`
  - Offline Heuristic Engine: Ensures 100% evaluation success even without an API key or when offline!

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Vite + React UI                       │
│  Landing Gateway │ Kanban Board │ AI Studio │ Nudges │ Hub  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST + Bearer JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express TypeScript Backend API              │
│                                                             │
│  ┌────────────────────────┐    ┌──────────────────────────┐ │
│  │ Ingestion Engine       │    │ State Machine & Logs     │ │
│  │ (Streaming CSV / JSON) │    │ (Applied->Interview->...)│ │
│  └────────────────────────┘    └──────────────────────────┘ │
│  ┌────────────────────────┐    ┌──────────────────────────┐ │
│  │ AI Multi-Stage Pipeline│    │ Nudge Background Worker  │ │
│  │ (Gemini 2.5 + Cascade) │    │ (Node-Cron Scheduler)    │ │
│  └────────────────────────┘    └──────────────────────────┘ │
│  ┌────────────────────────┐    ┌──────────────────────────┐ │
│  │ Auth Middleware        │    │ User Isolation           │ │
│  │ (Strict JWT Bearer)    │    │ (Scoped DB Queries)      │ │
│  └────────────────────────┘    └──────────────────────────┘ │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
 ┌───────────────────────────┐   ┌──────────────────────────────┐
 │ Google Gemini GenAI API   │   │ PostgreSQL 16 (Docker / SQL) │
 │ • Contextual letter gen   │   │ • JobPostings (Schema compliant)
 │ • Historical voice match  │   │ • Applications & Status Logs │
 │ • ATS alignment scoring   │   │ • Drafts & Automated Nudges  │
 └───────────────────────────┘   └──────────────────────────────┘
```

---

## 🔐 Authentication & Security

1. **Protected API Endpoints**: All endpoints (`/api/applications`, `/api/jobs`, `/api/drafts`, `/api/nudges`, `/api/analytics`) strictly require a valid `Authorization: Bearer <jwt-token>` header. Missing or expired tokens return `401 Unauthorized`.
2. **Password Security**: Passwords are salted and hashed using `bcryptjs` before storage.
3. **1-Click Evaluation Access**: Evaluators can click the green **"1-Click Evaluation Access (Demo Candidate)"** button on the landing page or navbar to immediately generate a valid JWT session for `demo@careeropt.ai` pre-seeded with 12 jobs and 6 historical drafts.
4. **Registration & Custom Users**: Evaluators can also register brand-new accounts with their own email and password to verify multi-tenant isolation.

---

## 🚀 Quick Start (One Command)

### Prerequisites
- Node.js $\ge 18$
- Docker & Docker Compose (for PostgreSQL)

### 1. Start the Database
```bash
docker compose up -d postgres
```
*(Runs PostgreSQL 16 on port 5433 with persistent volume)*

### 2. Install & Seed
```bash
# In the root directory
npm install
npm run db:push
npm run seed
```
*(Preloads 12 evaluation job postings and 6 historical cover letters/email drafts into PostgreSQL)*

### 3. Run Dev Server
```bash
npm run dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 📋 Evaluation Walkthrough & Testing

### 1. Authenticate & Obtain JWT Token
```bash
# Obtain Bearer token via demo endpoint:
AUTH_RES=$(curl -s -X POST http://localhost:5000/api/auth/demo)
TOKEN=$(node -e "console.log(JSON.parse('$AUTH_RES').token)")
echo "JWT Token: $TOKEN"
```

### 2. Ingesting Job Postings Schema
The system accepts CSV or raw input matching:
```csv
id, from, to, type, description
1, 2026-06-01, 2026-06-30, full-time, Senior Backend Engineer - Python, Bengaluru
2, 2026-06-10, 2026-07-10, contract, Data Platform Engineer - streaming pipelines
```

**Curl Test:**
```bash
curl -X POST http://localhost:5000/api/jobs/ingest-csv \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"csvContent": "id, from, to, type, description\n101, 2026-08-01, 2026-08-31, full-time, Staff Cloud Architect - GCP, Bengaluru"}'
```

### 3. Ingesting Associated Drafts Schema
The system accepts CSV matching:
```csv
id, jobId, type, contents, status
1, 1, cover_letter, "Dear Hiring Manager - I am applying for the Senior Backend Engineer...", draft
2, 1, follow_up_email, "Following up on my application from June 12...", sent
```

**Curl Test:**
```bash
curl -X POST http://localhost:5000/api/jobs/ingest-drafts-csv \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"csvContent": "id, jobId, type, contents, status\n201, 1, cover_letter, \"Dear TechCorp team...\", draft"}'
```

### 4. State Transitions & Audit Logs
Move applications between `Applied`, `Interview`, `Offer`, and `Reject`:
```bash
curl -X PATCH http://localhost:5000/api/applications/<APP_ID>/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "Interview", "note": "Passed preliminary architecture screening"}'
```

### 5. Triggering Automated Scheduled Nudges
Evaluate dormancy rules and trigger automated candidate alerts:
```bash
curl -X POST http://localhost:5000/api/nudges/evaluate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### 6. Generating AI Contextual Drafts
```bash
curl -X POST http://localhost:5000/api/drafts/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId": 1, "type": "cover_letter", "modelOverride": "gemini-2.5-flash"}'
```

---

## 🎨 UI/UX Features

- **Landing Gateway**: Ensures unauthenticated guests must sign in or use 1-click evaluation demo access before viewing candidate data.
- **Log Application Modal**: Allows authenticated candidates to log active applications with target company, specific role, application date, job type, requirements, and status.
- **Wide Kanban Board**: Uses full viewport width without congested text or awkward lateral whitespace.
- **AI Studio**: Side-by-side memory context showing historical drafts fed into Gemini, tone selector, live word count, and ATS score.
- **Nudge Center**: Direct quick actions (*Review Draft*, *Done*, *Dismiss*) with urgency tags.
- **Ingestion Hub**: Interactive preview table rendering parsed CSV rows before execution.

---

## ☁️ Google Cloud Deployment (Cloud Run)

```bash
# Set your GCP project
gcloud config set project YOUR_GCP_PROJECT_ID

# Build and deploy backend to Cloud Run
gcloud run deploy ai-job-backend \
  --source ./backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://...",GEMINI_API_KEY="AIza..."
```

---

## 🛡️ License
MIT License. Created for Google Code Kitchen 2026.
