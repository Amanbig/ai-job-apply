import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest, requireAuth } from '../middleware/auth.middleware.js';

export const analyticsRouter = Router();

analyticsRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const whereUser = userId ? { userId } : {};

    const [
      totalJobs,
      applications,
      drafts,
      nudges,
    ] = await Promise.all([
      prisma.jobPosting.count(),
      prisma.application.findMany({
        where: whereUser,
        include: { jobPosting: true },
      }),
      prisma.draft.findMany(),
      prisma.nudge.findMany({
        where: userId ? { application: { userId } } : {},
      }),
    ]);

    // Pipeline funnel breakdown
    const stageCounts = {
      Applied: applications.filter(a => a.status === 'Applied').length,
      Interview: applications.filter(a => a.status === 'Interview').length,
      Offer: applications.filter(a => a.status === 'Offer').length,
      Reject: applications.filter(a => a.status === 'Reject').length,
    };

    const totalApplications = applications.length;
    const interviewRate = totalApplications > 0
      ? Math.round(((stageCounts.Interview + stageCounts.Offer) / totalApplications) * 100)
      : 0;
    const offerRate = totalApplications > 0
      ? Math.round((stageCounts.Offer / totalApplications) * 100)
      : 0;

    // Draft statistics
    const draftsByStatus = {
      draft: drafts.filter(d => d.status === 'draft').length,
      sent: drafts.filter(d => d.status === 'sent').length,
      reviewed: drafts.filter(d => d.status === 'reviewed').length,
    };
    const draftsByType = {
      cover_letter: drafts.filter(d => d.type === 'cover_letter').length,
      follow_up_email: drafts.filter(d => d.type === 'follow_up_email').length,
    };

    const avgAtsScore = drafts.length > 0
      ? Math.round(drafts.reduce((acc, d) => acc + (d.atsScore || 85), 0) / drafts.length)
      : 0;

    // Nudges stats
    const nudgesByStatus = {
      pending: nudges.filter(n => n.status === 'pending').length,
      completed: nudges.filter(n => n.status === 'completed').length,
      dismissed: nudges.filter(n => n.status === 'dismissed').length,
    };

    res.json({
      metrics: {
        totalJobs,
        totalApplications,
        interviewRate,
        offerRate,
        stageCounts,
        draftsTotal: drafts.length,
        draftsByStatus,
        draftsByType,
        avgAtsScore,
        nudgesTotal: nudges.length,
        nudgesByStatus,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
