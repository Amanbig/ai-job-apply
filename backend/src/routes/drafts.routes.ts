import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { geminiService } from '../services/gemini.service.js';
import { AuthRequest, requireAuth } from '../middleware/auth.middleware.js';

export const draftsRouter = Router();

// GET drafts with optional filters
draftsRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { jobId, type, status } = req.query;
    const where: any = {};

    if (jobId) {
      where.jobId = Number(jobId);
    }
    if (type && type !== 'all') {
      where.type = String(type);
    }
    if (status && status !== 'all') {
      where.status = String(status);
    }

    const drafts = await prisma.draft.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        jobPosting: true,
        application: true,
      },
    });

    res.json({ drafts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single draft
draftsRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const draft = await prisma.draft.findUnique({
      where: { id: Number(req.params.id) },
      include: { jobPosting: true, application: true },
    });
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    res.json({ draft });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /generate: AI-driven contextual generation
draftsRouter.post('/generate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      jobId,
      applicationId,
      type = 'cover_letter',
      customInstructions,
      modelOverride,
    } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: Number(jobId) },
    });

    if (!jobPosting) {
      return res.status(404).json({ error: `Job posting #${jobId} not found` });
    }

    // Retrieve historical drafts for few-shot in-context learning
    const historicalDrafts = await prisma.draft.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        type: true,
        contents: true,
        status: true,
        atsScore: true,
      },
    });

    // Execute agentic generation
    const genResult = await geminiService.generateTailoredDraft({
      jobPosting,
      draftType: type as 'cover_letter' | 'follow_up_email',
      historicalDrafts,
      candidateName: req.user?.name || 'Amanpreet Singh',
      customInstructions,
      modelOverride,
    });

    // Get next ID
    const lastDraft = await prisma.draft.findFirst({ orderBy: { id: 'desc' } });
    const nextId = (lastDraft?.id || 0) + 1;

    // Persist draft
    const newDraft = await prisma.draft.create({
      data: {
        id: nextId,
        jobId: Number(jobId),
        applicationId: applicationId || null,
        type,
        contents: genResult.contents,
        status: 'draft',
        modelUsed: genResult.modelUsed,
        atsScore: genResult.atsScore,
        analysis: genResult.analysis,
      },
      include: {
        jobPosting: true,
      },
    });

    res.status(201).json({
      draft: newDraft,
      historicalDraftsCount: historicalDrafts.length,
      generationMeta: {
        modelUsed: genResult.modelUsed,
        atsScore: genResult.atsScore,
        analysis: genResult.analysis,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id: Update draft contents or status ('draft' | 'sent' | 'reviewed')
draftsRouter.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { contents, status, atsScore } = req.body;
    const updated = await prisma.draft.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(contents ? { contents } : {}),
        ...(status ? { status } : {}),
        ...(typeof atsScore === 'number' ? { atsScore } : {}),
      },
      include: {
        jobPosting: true,
      },
    });

    res.json({ draft: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
