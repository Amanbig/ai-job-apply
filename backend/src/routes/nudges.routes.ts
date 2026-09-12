import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { nudgeService } from '../services/nudge.service.js';
import { AuthRequest, requireAuth } from '../middleware/auth.middleware.js';

export const nudgesRouter = Router();

// GET all nudges with filtering
nudgesRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, type } = req.query;
    const where: any = {};

    if (req.user) {
      where.application = { userId: req.user.id };
    }

    if (status && status !== 'all') {
      where.status = String(status);
    }
    if (type && type !== 'all') {
      where.type = String(type);
    }

    const nudges = await prisma.nudge.findMany({
      where,
      orderBy: { scheduledDate: 'desc' },
      include: {
        application: {
          include: {
            jobPosting: true,
            drafts: true,
          },
        },
      },
    });

    res.json({ nudges });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger scheduled nudge evaluation immediately
nudgesRouter.post('/evaluate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await nudgeService.evaluateAllApplications(req.user?.id);
    res.json({
      success: true,
      message: `Nudge engine evaluated ${result.evaluatedApplications} active applications. Created ${result.newNudgesCreated} automated nudges.`,
      result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update nudge status: completed | dismissed | pending
nudgesRouter.patch('/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    if (!['completed', 'dismissed', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Status must be completed, dismissed, or pending' });
    }

    const updated = await nudgeService.updateNudgeStatus(String(req.params.id), status);
    res.json({ nudge: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
