import {
  JobPosting,
  Application,
  Draft,
  Nudge,
  AnalyticsMetrics,
  User,
  StatusTransitionLog,
} from '../types';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    demoLogin: async (): Promise<{ user: User; token: string }> => {
      const res = await fetch(`${BASE_URL}/auth/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await handleResponse<{ user: User; token: string }>(res);
      localStorage.setItem('token', data.token);
      return data;
    },
    getMe: async (): Promise<{ user: User }> => {
      const res = await fetch(`${BASE_URL}/auth/me`, { headers: getAuthHeaders() });
      return handleResponse<{ user: User }>(res);
    },
  },

  jobs: {
    getAll: async (params?: { type?: string; search?: string }): Promise<{ postings: JobPosting[] }> => {
      const query = new URLSearchParams();
      if (params?.type && params.type !== 'all') query.set('type', params.type);
      if (params?.search) query.set('search', params.search);
      const res = await fetch(`${BASE_URL}/jobs?${query.toString()}`, { headers: getAuthHeaders() });
      return handleResponse<{ postings: JobPosting[] }>(res);
    },
    getById: async (id: number): Promise<{ posting: JobPosting }> => {
      const res = await fetch(`${BASE_URL}/jobs/${id}`, { headers: getAuthHeaders() });
      return handleResponse<{ posting: JobPosting }>(res);
    },
    create: async (data: { from?: string; to?: string; type: string; description: string }): Promise<{ posting: JobPosting }> => {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<{ posting: JobPosting }>(res);
    },
    ingestCsv: async (csvContent: string): Promise<any> => {
      const res = await fetch(`${BASE_URL}/jobs/ingest-csv`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ csvContent }),
      });
      return handleResponse<any>(res);
    },
    ingestDraftsCsv: async (csvContent: string): Promise<any> => {
      const res = await fetch(`${BASE_URL}/jobs/ingest-drafts-csv`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ csvContent }),
      });
      return handleResponse<any>(res);
    },
    loadBenchmark: async (): Promise<any> => {
      const res = await fetch(`${BASE_URL}/jobs/load-benchmark`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return handleResponse<any>(res);
    },
  },

  applications: {
    getAll: async (status?: string): Promise<{ applications: Application[] }> => {
      const query = new URLSearchParams();
      if (status && status !== 'all') query.set('status', status);
      const res = await fetch(`${BASE_URL}/applications?${query.toString()}`, { headers: getAuthHeaders() });
      return handleResponse<{ applications: Application[] }>(res);
    },
    getById: async (id: string): Promise<{ application: Application }> => {
      const res = await fetch(`${BASE_URL}/applications/${id}`, { headers: getAuthHeaders() });
      return handleResponse<{ application: Application }>(res);
    },
    updateStatus: async (
      id: string,
      data: { status: string; note?: string; interviewDate?: string; salaryOffer?: string }
    ): Promise<{ application: Application }> => {
      const res = await fetch(`${BASE_URL}/applications/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<{ application: Application }>(res);
    },
    getHistory: async (id: string): Promise<{ logs: StatusTransitionLog[] }> => {
      const res = await fetch(`${BASE_URL}/applications/${id}/history`, { headers: getAuthHeaders() });
      return handleResponse<{ logs: StatusTransitionLog[] }>(res);
    },
  },

  drafts: {
    getAll: async (params?: { jobId?: number; type?: string; status?: string }): Promise<{ drafts: Draft[] }> => {
      const query = new URLSearchParams();
      if (params?.jobId) query.set('jobId', String(params.jobId));
      if (params?.type && params.type !== 'all') query.set('type', params.type);
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      const res = await fetch(`${BASE_URL}/drafts?${query.toString()}`, { headers: getAuthHeaders() });
      return handleResponse<{ drafts: Draft[] }>(res);
    },
    generate: async (data: {
      jobId: number;
      applicationId?: string;
      type: 'cover_letter' | 'follow_up_email';
      customInstructions?: string;
      modelOverride?: string;
    }): Promise<{ draft: Draft; historicalDraftsCount: number; generationMeta: any }> => {
      const res = await fetch(`${BASE_URL}/drafts/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<{ draft: Draft; historicalDraftsCount: number; generationMeta: any }>(res);
    },
    update: async (id: number, data: { contents?: string; status?: string; atsScore?: number }): Promise<{ draft: Draft }> => {
      const res = await fetch(`${BASE_URL}/drafts/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<{ draft: Draft }>(res);
    },
  },

  nudges: {
    getAll: async (params?: { status?: string; type?: string }): Promise<{ nudges: Nudge[] }> => {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      if (params?.type && params.type !== 'all') query.set('type', params.type);
      const res = await fetch(`${BASE_URL}/nudges?${query.toString()}`, { headers: getAuthHeaders() });
      return handleResponse<{ nudges: Nudge[] }>(res);
    },
    evaluate: async (): Promise<any> => {
      const res = await fetch(`${BASE_URL}/nudges/evaluate`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return handleResponse<any>(res);
    },
    updateStatus: async (id: string, status: 'completed' | 'dismissed' | 'pending'): Promise<{ nudge: Nudge }> => {
      const res = await fetch(`${BASE_URL}/nudges/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse<{ nudge: Nudge }>(res);
    },
  },

  analytics: {
    getMetrics: async (): Promise<{ metrics: AnalyticsMetrics }> => {
      const res = await fetch(`${BASE_URL}/analytics`, { headers: getAuthHeaders() });
      return handleResponse<{ metrics: AnalyticsMetrics }>(res);
    },
  },
};
