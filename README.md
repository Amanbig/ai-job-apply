# AI Job Application Tracker & Career Optimization Pipeline

An enterprise-grade career optimization pipeline and application tracking dashboard powered by **Google Cloud & Google Gemini GenAI**, built for the **Google Code Kitchen** challenge.

![Architecture](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run%20%7C%20Gemini%202.5-4285F4?logo=google-cloud)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![React](https://img.shields.io/badge/React%20%2B%20Vite-18-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss)

---

## 🌟 Core Highlights & Problem Fit

- **Persistent 4-Phase Pipeline Board**: Track and transition applications across `Applied`, `Interview`, `Offer`, and `Reject` with persistent state logs and full audit histories.
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
│  Kanban Board │ AI Draft Studio │ Nudge Center │ Ingestion │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST
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

### 1. Ingesting Job Postings Schema
The system accepts CSV or raw input matching:
```csv
id, from, to, type, description
1, 2026-06-01, 2026-06-30, full-time, Senior Backend Engineer - Python, Bengaluru
2, 2026-06-10, 2026-07-10, contract, Data Platform Engineer - streaming pipelines
```

**Curl Test:**
```bash
curl -X POST http://localhost:5000/api/jobs/ingest-csv \
  -H "Content-Type: application/json" \
  -d '{"csvContent": "id, from, to, type, description\n101, 2026-08-01, 2026-08-31, full-time, Staff Cloud Architect - GCP, Bengaluru"}'
```

### 2. Ingesting Associated Drafts Schema
The system accepts CSV matching:
```csv
id, jobId, type, contents, status
1, 1, cover_letter, "Dear Hiring Manager - I am applying for the Senior Backend Engineer...", draft
2, 1, follow_up_email, "Following up on my application from June 12...", sent
```

**Curl Test:**
```bash
curl -X POST http://localhost:5000/api/jobs/ingest-drafts-csv \
  -H "Content-Type: application/json" \
  -d '{"csvContent": "id, jobId, type, contents, status\n201, 1, cover_letter, \"Dear TechCorp team...\", draft"}'
```

### 3. State Transitions & Audit Logs
Move applications between `Applied`, `Interview`, `Offer`, and `Reject`:
```bash
curl -X PATCH http://localhost:5000/api/applications/<APP_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "Interview", "note": "Passed preliminary architecture screening"}'
```

### 4. Triggering Automated Scheduled Nudges
Evaluate dormancy rules and trigger automated candidate alerts:
```bash
curl -X POST http://localhost:5000/api/nudges/evaluate \
  -H "Content-Type: application/json"
```

### 5. Generating AI Contextual Drafts
```bash
curl -X POST http://localhost:5000/api/drafts/generate \
  -H "Content-Type: application/json" \
  -d '{"jobId": 1, "type": "cover_letter", "modelOverride": "gemini-2.5-flash"}'
```

---

## ☁️ Google Cloud Deployment (Cloud Run)

The application is container-ready. To deploy to **Google Cloud Run**:

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
