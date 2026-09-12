export interface JobPosting {
  id: number;
  from: string;
  to: string;
  type: string;
  description: string;
  company: string;
  role: string;
  location?: string;
  techStack?: string[];
  applications?: Application[];
  drafts?: Draft[];
}

export interface Application {
  id: string;
  userId: string;
  jobPostingId: number;
  status: 'Applied' | 'Interview' | 'Offer' | 'Reject';
  appliedDate: string;
  notes?: string;
  interviewDate?: string;
  salaryOffer?: string;
  createdAt: string;
  updatedAt: string;
  jobPosting: JobPosting;
  drafts?: Draft[];
  nudges?: Nudge[];
  statusLogs?: StatusTransitionLog[];
}

export interface Draft {
  id: number;
  jobId: number;
  applicationId?: string | null;
  type: 'cover_letter' | 'follow_up_email';
  contents: string;
  status: 'draft' | 'sent' | 'reviewed';
  modelUsed?: string;
  atsScore?: number;
  analysis?: {
    matchedKeywords?: string[];
    missingKeywords?: string[];
    strengths?: string[];
    suggestions?: string[];
    tone?: string;
  };
  createdAt?: string;
  jobPosting?: JobPosting;
}

export interface Nudge {
  id: string;
  applicationId: string;
  type: 'follow_up_reminder' | 'prep_interview' | 'offer_decision' | 'deadline_warning';
  scheduledDate: string;
  status: 'pending' | 'triggered' | 'dismissed' | 'completed';
  message: string;
  triggerReason: string;
  actionPayload?: any;
  createdAt: string;
  application?: Application;
}

export interface StatusTransitionLog {
  id: string;
  applicationId: string;
  fromStatus: string;
  toStatus: string;
  changedAt: string;
  note?: string;
}

export interface AnalyticsMetrics {
  totalJobs: number;
  totalApplications: number;
  interviewRate: number;
  offerRate: number;
  stageCounts: {
    Applied: number;
    Interview: number;
    Offer: number;
    Reject: number;
  };
  draftsTotal: number;
  draftsByStatus: {
    draft: number;
    sent: number;
    reviewed: number;
  };
  draftsByType: {
    cover_letter: number;
    follow_up_email: number;
  };
  avgAtsScore: number;
  nudgesTotal: number;
  nudgesByStatus: {
    pending: number;
    completed: number;
    dismissed: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
}
