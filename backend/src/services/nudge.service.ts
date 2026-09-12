import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { geminiService } from './gemini.service.js';

export class NudgeService {
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    // Start automated scheduler: runs every 30 minutes in production, or on demand
    this.startScheduler();
  }

  public startScheduler() {
    // Run at minute 0 and 30
    this.cronJob = cron.schedule('*/30 * * * *', async () => {
      console.log('⏰ [NudgeService] Running scheduled nudge evaluation pass...');
      try {
        await this.evaluateAllApplications();
      } catch (err) {
        console.error('❌ Error evaluating automated nudges:', err);
      }
    });
    console.log('🚀 [NudgeService] Scheduled background worker initialized.');
  }

  /**
   * Scans all active applications and applies proactive career optimization rules
   */
  public async evaluateAllApplications(targetUserId?: string) {
    const whereClause = targetUserId ? { userId: targetUserId } : {};
    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        jobPosting: true,
        drafts: true,
        nudges: true,
        user: true,
      },
    });

    const createdNudges: any[] = [];
    const now = new Date();

    for (const app of applications) {
      const daysSinceApplied = Math.floor((now.getTime() - app.appliedDate.getTime()) / 86400000);

      // RULE 1: Applied > 7 days without sent follow-up
      if (app.status === 'Applied' && daysSinceApplied >= 7) {
        const hasSentFollowUp = app.drafts.some(
          d => d.type === 'follow_up_email' && d.status === 'sent'
        );
        const existingFollowUpNudge = app.nudges.some(
          n => n.type === 'follow_up_reminder' && (n.status === 'pending' || n.status === 'triggered')
        );

        if (!hasSentFollowUp && !existingFollowUpNudge) {
          // Check or create ready-to-send follow-up draft
          let followUpDraft = app.drafts.find(d => d.type === 'follow_up_email');
          if (!followUpDraft) {
            // Auto-generate a draft
            const genResult = await geminiService.generateTailoredDraft({
              jobPosting: app.jobPosting,
              draftType: 'follow_up_email',
              historicalDrafts: app.drafts,
              candidateName: app.user.name,
            });

            // Find next available draft ID
            const lastDraft = await prisma.draft.findFirst({ orderBy: { id: 'desc' } });
            const nextDraftId = (lastDraft?.id || 0) + 1;

            followUpDraft = await prisma.draft.create({
              data: {
                id: nextDraftId,
                jobId: app.jobPostingId,
                applicationId: app.id,
                type: 'follow_up_email',
                contents: genResult.contents,
                status: 'draft',
                modelUsed: genResult.modelUsed,
                atsScore: genResult.atsScore,
                analysis: genResult.analysis,
              },
            });
          }

          const nudge = await prisma.nudge.create({
            data: {
              applicationId: app.id,
              type: 'follow_up_reminder',
              scheduledDate: now,
              status: 'pending',
              message: `It has been ${daysSinceApplied} days since applying to ${app.jobPosting.company} for "${app.jobPosting.role}". A follow-up email draft is ready for your review.`,
              triggerReason: `Inactivity rule: Applied ${daysSinceApplied} days ago with no response.`,
              actionPayload: {
                suggestedAction: 'send_follow_up',
                draftId: followUpDraft.id,
                company: app.jobPosting.company,
                role: app.jobPosting.role,
              },
            },
          });
          createdNudges.push(nudge);
        }
      }

      // RULE 2: Interview Scheduled or upcoming
      if (app.status === 'Interview') {
        const existingInterviewNudge = app.nudges.some(
          n => n.type === 'prep_interview' && (n.status === 'pending' || n.status === 'triggered')
        );

        if (!existingInterviewNudge) {
          const nudge = await prisma.nudge.create({
            data: {
              applicationId: app.id,
              type: 'prep_interview',
              scheduledDate: now,
              status: 'pending',
              message: `Upcoming interview stage at ${app.jobPosting.company} for "${app.jobPosting.role}". Review key talking points and technical stack (${app.jobPosting.techStack.slice(0, 4).join(', ') || 'distributed systems'}).`,
              triggerReason: 'Pipeline transition: Interview phase active.',
              actionPayload: {
                suggestedAction: 'prep_interview',
                company: app.jobPosting.company,
                role: app.jobPosting.role,
                techStack: app.jobPosting.techStack,
              },
            },
          });
          createdNudges.push(nudge);
        }
      }

      // RULE 3: Offer received - proactive evaluation
      if (app.status === 'Offer') {
        const existingOfferNudge = app.nudges.some(
          n => n.type === 'offer_decision' && (n.status === 'pending' || n.status === 'triggered')
        );

        if (!existingOfferNudge) {
          const nudge = await prisma.nudge.create({
            data: {
              applicationId: app.id,
              type: 'offer_decision',
              scheduledDate: now,
              status: 'pending',
              message: `Offer in progress from ${app.jobPosting.company}! ${app.salaryOffer ? `Current offer: ${app.salaryOffer}. ` : ''}Prepare your negotiation talking points before the decision deadline.`,
              triggerReason: 'Pipeline transition: Offer received.',
              actionPayload: {
                suggestedAction: 'negotiate_offer',
                company: app.jobPosting.company,
              },
            },
          });
          createdNudges.push(nudge);
        }
      }

      // RULE 4: Application deadline closing within 3 days
      const daysUntilClosing = Math.floor((app.jobPosting.to.getTime() - now.getTime()) / 86400000);
      if (daysUntilClosing >= 0 && daysUntilClosing <= 3) {
        const existingDeadlineNudge = app.nudges.some(
          n => n.type === 'deadline_warning' && (n.status === 'pending' || n.status === 'triggered')
        );

        if (!existingDeadlineNudge) {
          const nudge = await prisma.nudge.create({
            data: {
              applicationId: app.id,
              type: 'deadline_warning',
              scheduledDate: now,
              status: 'pending',
              message: `Application deadline for ${app.jobPosting.company} closes in ${daysUntilClosing === 0 ? 'today' : `${daysUntilClosing} days`}. Ensure your pipeline actions are updated.`,
              triggerReason: 'Posting expiration deadline warning.',
              actionPayload: {
                suggestedAction: 'deadline_alert',
                company: app.jobPosting.company,
              },
            },
          });
          createdNudges.push(nudge);
        }
      }
    }

    return {
      evaluatedApplications: applications.length,
      newNudgesCreated: createdNudges.length,
      createdNudges,
    };
  }

  /**
   * Updates status of a nudge (completed, dismissed, pending)
   */
  public async updateNudgeStatus(nudgeId: string, status: 'completed' | 'dismissed' | 'pending') {
    return prisma.nudge.update({
      where: { id: nudgeId },
      data: { status },
    });
  }
}

export const nudgeService = new NudgeService();
