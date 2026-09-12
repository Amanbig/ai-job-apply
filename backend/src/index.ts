import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes.js';
import { jobsRouter } from './routes/jobs.routes.js';
import { applicationsRouter } from './routes/applications.routes.js';
import { draftsRouter } from './routes/drafts.routes.js';
import { nudgesRouter } from './routes/nudges.routes.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import { nudgeService } from './services/nudge.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ai-job-tracker-backend',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/drafts', draftsRouter);
app.use('/api/nudges', nudgesRouter);
app.use('/api/analytics', analyticsRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 AI Job Pipeline API running on http://localhost:${PORT}`);
  console.log(`🤖 Gemini Model Cascade: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'} (with fallback)`);
  console.log(`📊 Ingestion & Evaluation API ready at /api/jobs/ingest-csv`);
  console.log(`======================================================\n`);
});
