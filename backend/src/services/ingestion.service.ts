import { parse } from 'csv-parse/sync';
import { prisma } from '../config/prisma.js';
import { geminiService } from './gemini.service.js';

export interface IngestJobRecord {
  id: number;
  from: Date;
  to: Date;
  type: string;
  description: string;
}

export interface IngestDraftRecord {
  id: number;
  jobId: number;
  type: string;
  contents: string;
  status: string;
}

export class IngestionService {
  /**
   * Ingests CSV or raw text for Job Postings in schema:
   * <id>, <from>, <to>, <type>, <description>
   */
  public async ingestJobPostingsFromCSV(csvContent: string, userId?: string) {
    const startTime = Date.now();
    const rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    const ingested: any[] = [];
    const errors: any[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        const id = parseInt(row.id || row.Id || row.ID || index + 1, 10);
        const fromStr = row.from || row.From || row['<from>'];
        const toStr = row.to || row.To || row['<to>'];
        const typeStr = (row.type || row.Type || row['<type>'] || 'full-time').toLowerCase();
        const descriptionStr = row.description || row.Description || row['<description>'] || '';

        const fromDate = fromStr ? new Date(fromStr) : new Date();
        const toDate = toStr ? new Date(toStr) : new Date(Date.now() + 30 * 86400000);

        // Intelligent extraction of structured parameters
        const metadata = await geminiService.extractJobMetadata(descriptionStr);

        const posting = await prisma.jobPosting.upsert({
          where: { id },
          update: {
            from: isNaN(fromDate.getTime()) ? new Date() : fromDate,
            to: isNaN(toDate.getTime()) ? new Date(Date.now() + 30 * 86400000) : toDate,
            type: typeStr,
            description: descriptionStr,
            company: metadata.company,
            role: metadata.role,
            location: metadata.location,
            techStack: metadata.techStack,
          },
          create: {
            id,
            from: isNaN(fromDate.getTime()) ? new Date() : fromDate,
            to: isNaN(toDate.getTime()) ? new Date(Date.now() + 30 * 86400000) : toDate,
            type: typeStr,
            description: descriptionStr,
            company: metadata.company,
            role: metadata.role,
            location: metadata.location,
            techStack: metadata.techStack,
          },
        });

        // If a userId is supplied, create or ensure an active Application
        if (userId) {
          const app = await prisma.application.upsert({
            where: {
              userId_jobPostingId: {
                userId,
                jobPostingId: id,
              },
            },
            update: {},
            create: {
              userId,
              jobPostingId: id,
              status: 'Applied',
              appliedDate: fromDate,
              notes: `Auto-ingested from evaluation dataset on ${new Date().toLocaleDateString()}`,
            },
          });

          await prisma.statusTransitionLog.create({
            data: {
              applicationId: app.id,
              fromStatus: 'Ingested',
              toStatus: 'Applied',
              note: 'Application initiated via batch dataset ingestion',
            },
          });
        }

        ingested.push(posting);
      } catch (err: any) {
        errors.push({ row: index + 1, error: err.message, data: row });
      }
    }

    return {
      success: true,
      count: ingested.length,
      errors,
      durationMs: Date.now() - startTime,
      postings: ingested,
    };
  }

  /**
   * Ingests CSV or raw text for Drafts in schema:
   * <id>, <jobId>, <type>, <contents>, <status>
   */
  public async ingestDraftsFromCSV(csvContent: string, userId?: string) {
    const startTime = Date.now();
    const rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    const ingested: any[] = [];
    const errors: any[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        const id = parseInt(row.id || row.Id || index + 1, 10);
        const jobId = parseInt(row.jobId || row.job_id || row['<jobId>'] || 1, 10);
        const type = (row.type || row['<type>'] || 'cover_letter').toLowerCase();
        const contents = row.contents || row.content || row['<contents>'] || '';
        const status = (row.status || row['<status>'] || 'draft').toLowerCase();

        // Check if job exists
        const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
        if (!job) {
          // If job doesn't exist yet, create a placeholder job so foreign key constraint holds
          await prisma.jobPosting.create({
            data: {
              id: jobId,
              from: new Date(),
              to: new Date(Date.now() + 30 * 86400000),
              type: 'full-time',
              description: `Job #${jobId} (Auto-created during draft ingestion)`,
              company: `Company #${jobId}`,
              role: `Engineering Role #${jobId}`,
            },
          });
        }

        // Link with application if available
        let linkedApplicationId: string | null = null;
        if (userId) {
          const app = await prisma.application.findFirst({
            where: { jobPostingId: jobId, userId },
          });
          if (app) {
            linkedApplicationId = app.id;
          }
        }

        const draft = await prisma.draft.upsert({
          where: { id },
          update: {
            jobId,
            applicationId: linkedApplicationId,
            type,
            contents,
            status,
          },
          create: {
            id,
            jobId,
            applicationId: linkedApplicationId,
            type,
            contents,
            status,
            modelUsed: 'evaluation-dataset',
            atsScore: 90,
          },
        });

        ingested.push(draft);
      } catch (err: any) {
        errors.push({ row: index + 1, error: err.message, data: row });
      }
    }

    return {
      success: true,
      count: ingested.length,
      errors,
      durationMs: Date.now() - startTime,
      drafts: ingested,
    };
  }
}

export const ingestionService = new IngestionService();
