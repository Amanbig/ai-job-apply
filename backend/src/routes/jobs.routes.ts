import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { ingestionService } from '../services/ingestion.service.js';
import { geminiService } from '../services/gemini.service.js';
import { AuthRequest, requireAuth } from '../middleware/auth.middleware.js';
import { SAMPLE_JOB_POSTINGS, SAMPLE_DRAFTS } from '../data/benchmarkData.js';

export const jobsRouter = Router();

// GET all job postings
jobsRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { type, search } = req.query;
    const where: any = {};

    if (type && type !== 'all') {
      where.type = String(type).toLowerCase();
    }

    if (search) {
      const q = String(search);
      where.OR = [
        { role: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const postings = await prisma.jobPosting.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        applications: {
          where: { userId: req.user?.id },
          include: {
            drafts: true,
            nudges: true,
          },
        },
        drafts: true,
      },
    });

    res.json({ postings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single job posting
jobsRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const posting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        applications: {
          where: { userId: req.user?.id },
          include: {
            drafts: true,
            nudges: true,
            statusLogs: { orderBy: { changedAt: 'desc' } },
          },
        },
        drafts: true,
      },
    });

    if (!posting) {
      return res.status(404).json({ error: 'Job posting not found' });
    }

    res.json({ posting });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create a single posting manually
jobsRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { from, to, type, description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const lastJob = await prisma.jobPosting.findFirst({ orderBy: { id: 'desc' } });
    const id = (lastJob?.id || 0) + 1;

    const metadata = await geminiService.extractJobMetadata(description);

    const posting = await prisma.jobPosting.create({
      data: {
        id,
        from: from ? new Date(from) : new Date(),
        to: to ? new Date(to) : new Date(Date.now() + 30 * 86400000),
        type: (type || 'full-time').toLowerCase(),
        description,
        company: metadata.company,
        role: metadata.role,
        location: metadata.location,
        techStack: metadata.techStack,
      },
    });

    // Automatically create an application for the current user
    if (req.user) {
      await prisma.application.create({
        data: {
          userId: req.user.id,
          jobPostingId: posting.id,
          status: 'Applied',
          appliedDate: posting.from,
        },
      });
    }

    res.status(201).json({ posting });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Ingest Postings CSV matching evaluation schema:
// <id>, <from>, <to>, <type>, <description>
jobsRouter.post('/ingest-csv', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ error: 'csvContent string is required in request body' });
    }

    const result = await ingestionService.ingestJobPostingsFromCSV(csvContent, req.user?.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Ingest Drafts CSV matching evaluation schema:
// <id>, <jobId>, <type>, <contents>, <status>
jobsRouter.post('/ingest-drafts-csv', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ error: 'csvContent string is required in request body' });
    }

    const result = await ingestionService.ingestDraftsFromCSV(csvContent, req.user?.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Load standard evaluation benchmark dataset (10+ jobs & historical drafts)
jobsRouter.post('/load-benchmark', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    for (const job of SAMPLE_JOB_POSTINGS) {
      await prisma.jobPosting.upsert({
        where: { id: job.id },
        update: {
          from: job.from,
          to: job.to,
          type: job.type,
          description: job.description,
          company: job.company,
          role: job.role,
          location: job.location,
          techStack: job.techStack,
        },
        create: {
          id: job.id,
          from: job.from,
          to: job.to,
          type: job.type,
          description: job.description,
          company: job.company,
          role: job.role,
          location: job.location,
          techStack: job.techStack,
        },
      });

      if (userId) {
        // distribute statuses across Applied, Interview, Offer, Reject
        const status = job.id === 1 || job.id === 6 ? 'Interview' :
                       job.id === 3 ? 'Offer' :
                       job.id === 5 ? 'Reject' : 'Applied';

        await prisma.application.upsert({
          where: {
            userId_jobPostingId: {
              userId,
              jobPostingId: job.id,
            },
          },
          update: { status },
          create: {
            userId,
            jobPostingId: job.id,
            status,
            appliedDate: job.from,
          },
        });
      }
    }

    for (const draft of SAMPLE_DRAFTS) {
      await prisma.draft.upsert({
        where: { id: draft.id },
        update: {
          jobId: draft.jobId,
          type: draft.type,
          contents: draft.contents,
          status: draft.status,
          atsScore: draft.atsScore,
          modelUsed: draft.modelUsed,
        },
        create: {
          id: draft.id,
          jobId: draft.jobId,
          type: draft.type,
          contents: draft.contents,
          status: draft.status,
          atsScore: draft.atsScore,
          modelUsed: draft.modelUsed,
        },
      });
    }

    res.json({
      success: true,
      message: 'Benchmark dataset loaded: 12 job postings and 6 historical drafts initialized.',
      totalJobs: SAMPLE_JOB_POSTINGS.length,
      totalDrafts: SAMPLE_DRAFTS.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
