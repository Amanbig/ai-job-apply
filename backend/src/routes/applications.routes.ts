import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { pipelineService, PipelineStatus } from '../services/pipeline.service.js';
import { AuthRequest, requireAuth } from '../middleware/auth.middleware.js';

export const applicationsRouter = Router();

// GET all applications for current candidate
applicationsRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const where: any = { userId: req.user?.id };

    if (status && status !== 'all') {
      where.status = String(status);
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        jobPosting: true,
        drafts: { orderBy: { createdAt: 'desc' } },
        nudges: { orderBy: { scheduledDate: 'desc' } },
        statusLogs: { orderBy: { changedAt: 'desc' } },
      },
    });

    res.json({ applications });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single application
applicationsRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        jobPosting: true,
        drafts: { orderBy: { createdAt: 'desc' } },
        nudges: { orderBy: { scheduledDate: 'desc' } },
        statusLogs: { orderBy: { changedAt: 'desc' } },
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ application });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new application
applicationsRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { jobPostingId, status = 'Applied', notes, interviewDate, salaryOffer } = req.body;
    if (!jobPostingId || !req.user) {
      return res.status(400).json({ error: 'jobPostingId is required' });
    }

    const application = await prisma.application.upsert({
      where: {
        userId_jobPostingId: {
          userId: req.user.id,
          jobPostingId: Number(jobPostingId),
        },
      },
      update: {
        status,
        notes,
        ...(interviewDate ? { interviewDate: new Date(interviewDate) } : {}),
        ...(salaryOffer ? { salaryOffer } : {}),
      },
      create: {
        userId: req.user.id,
        jobPostingId: Number(jobPostingId),
        status,
        notes,
        ...(interviewDate ? { interviewDate: new Date(interviewDate) } : {}),
        ...(salaryOffer ? { salaryOffer } : {}),
      },
      include: {
        jobPosting: true,
        drafts: true,
        nudges: true,
      },
    });

    await prisma.statusTransitionLog.create({
      data: {
        applicationId: application.id,
        fromStatus: 'Initiated',
        toStatus: status,
        note: `Application created with initial status: ${status}`,
      },
    });

    res.status(201).json({ application });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Transition application status: Applied | Interview | Offer | Reject
applicationsRouter.patch('/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, note, interviewDate, salaryOffer } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'New status is required' });
    }

    const id = String(req.params.id);
    const parsedInterviewDate = interviewDate ? new Date(interviewDate) : undefined;
    const updated = await pipelineService.transitionStatus(
      id,
      status as PipelineStatus,
      note,
      parsedInterviewDate,
      salaryOffer
    );

    res.json({ application: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get persistent state transition logs
applicationsRouter.get('/:id/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const logs = await pipelineService.getApplicationHistory(id);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
