import { prisma } from '../config/prisma.js';
import { nudgeService } from './nudge.service.js';

export const VALID_STATUSES = ['Applied', 'Interview', 'Offer', 'Reject'] as const;
export type PipelineStatus = typeof VALID_STATUSES[number];

export class PipelineService {
  /**
   * Transitions an application from its current status to a new status,
   * creates an audit log entry, and triggers workflow nudges.
   */
  public async transitionStatus(
    applicationId: string,
    newStatus: PipelineStatus,
    note?: string,
    interviewDate?: Date,
    salaryOffer?: string
  ) {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const currentApp = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { jobPosting: true },
    });

    if (!currentApp) {
      throw new Error(`Application ${applicationId} not found.`);
    }

    const oldStatus = currentApp.status;

    // Update application
    const updatedApp = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        notes: note ? `${currentApp.notes || ''}\n[${new Date().toLocaleDateString()}]: ${note}`.trim() : currentApp.notes,
        ...(interviewDate ? { interviewDate } : {}),
        ...(salaryOffer ? { salaryOffer } : {}),
      },
      include: {
        jobPosting: true,
        drafts: true,
        nudges: true,
        statusLogs: { orderBy: { changedAt: 'desc' } },
      },
    });

    // Record persistent audit log
    await prisma.statusTransitionLog.create({
      data: {
        applicationId,
        fromStatus: oldStatus,
        toStatus: newStatus,
        note: note || `Transitioned stage from ${oldStatus} to ${newStatus}`,
      },
    });

    // Proactive trigger: run nudge evaluation for user to schedule relevant alerts
    await nudgeService.evaluateAllApplications(currentApp.userId);

    return updatedApp;
  }

  /**
   * Retrieves full audit logs and timeline for an application
   */
  public async getApplicationHistory(applicationId: string) {
    return prisma.statusTransitionLog.findMany({
      where: { applicationId },
      orderBy: { changedAt: 'desc' },
    });
  }
}

export const pipelineService = new PipelineService();
