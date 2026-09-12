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

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP Error ${res.status}`);
  }
  return res.json();
}

async function attemptSilentRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newToken = data.accessToken || data.token;
    if (newToken) {
      localStorage.setItem('token', newToken);
      return newToken;
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Automatically transmits HTTP-only cookies in browsers
  });

  // If unauthorized due to access token expiry, automatically attempt silent token refresh
  if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
    const refreshedToken = await attemptSilentRefresh();
    if (refreshedToken) {
      const retryHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshedToken}`,
        ...(options.headers || {}),
      };
      response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
        credentials: 'include',
      });
    }
  }

  return handleResponse<T>(response);
}

export const api = {
  auth: {
    getMe: async (): Promise<{ user: User }> => {
      return fetchWithAuth<{ user: User }>('/auth/me');
    },
    refreshToken: async (): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      return handleResponse(res);
    },
    logout: async (): Promise<{ message: string }> => {
      const res = await fetchWithAuth<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
      localStorage.removeItem('token');
      return res;
    },
  },

  jobs: {
    getAll: async (params?: { type?: string; search?: string }): Promise<{ postings: JobPosting[] }> => {
      const query = new URLSearchParams();
      if (params?.type && params.type !== 'all') query.set('type', params.type);
      if (params?.search) query.set('search', params.search);
      return fetchWithAuth<{ postings: JobPosting[] }>(`/jobs?${query.toString()}`);
    },
    getById: async (id: number): Promise<{ posting: JobPosting }> => {
      return fetchWithAuth<{ posting: JobPosting }>(`/jobs/${id}`);
    },
    create: async (data: { from?: string; to?: string; type: string; description: string }): Promise<{ posting: JobPosting }> => {
      return fetchWithAuth<{ posting: JobPosting }>('/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    ingestCsv: async (csvContent: string): Promise<any> => {
      return fetchWithAuth<any>('/jobs/ingest-csv', {
        method: 'POST',
        body: JSON.stringify({ csvContent }),
      });
    },
    ingestDraftsCsv: async (csvContent: string): Promise<any> => {
      return fetchWithAuth<any>('/jobs/ingest-drafts-csv', {
        method: 'POST',
        body: JSON.stringify({ csvContent }),
      });
    },
    loadBenchmark: async (): Promise<any> => {
      return fetchWithAuth<any>('/jobs/load-benchmark', {
        method: 'POST',
      });
    },
  },

  applications: {
    getAll: async (status?: string): Promise<{ applications: Application[] }> => {
      const query = new URLSearchParams();
      if (status && status !== 'all') query.set('status', status);
      return fetchWithAuth<{ applications: Application[] }>(`/applications?${query.toString()}`);
    },
    getById: async (id: string): Promise<{ application: Application }> => {
      return fetchWithAuth<{ application: Application }>(`/applications/${id}`);
    },
    updateStatus: async (
      id: string,
      data: { status: string; note?: string; interviewDate?: string; salaryOffer?: string }
    ): Promise<{ application: Application }> => {
      return fetchWithAuth<{ application: Application }>(`/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    getHistory: async (id: string): Promise<{ logs: StatusTransitionLog[] }> => {
      return fetchWithAuth<{ logs: StatusTransitionLog[] }>(`/applications/${id}/history`);
    },
  },

  drafts: {
    getAll: async (params?: { jobId?: number; type?: string; status?: string }): Promise<{ drafts: Draft[] }> => {
      const query = new URLSearchParams();
      if (params?.jobId) query.set('jobId', String(params.jobId));
      if (params?.type && params.type !== 'all') query.set('type', params.type);
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      return fetchWithAuth<{ drafts: Draft[] }>(`/drafts?${query.toString()}`);
    },
    generate: async (data: {
      jobId: number;
      applicationId?: string;
      type: 'cover_letter' | 'follow_up_email';
      customInstructions?: string;
      modelOverride?: string;
    }): Promise<{ draft: Draft; historicalDraftsCount: number; generationMeta: any }> => {
      return fetchWithAuth<{ draft: Draft; historicalDraftsCount: number; generationMeta: any }>('/drafts/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: number, data: { contents?: string; status?: string; atsScore?: number }): Promise<{ draft: Draft }> => {
      return fetchWithAuth<{ draft: Draft }>(`/drafts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  nudges: {
    getAll: async (params?: { status?: string; type?: string }): Promise<{ nudges: Nudge[] }> => {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      if (params?.type && params.type !== 'all') query.set('type', params.type);
      return fetchWithAuth<{ nudges: Nudge[] }>(`/nudges?${query.toString()}`);
    },
    evaluate: async (): Promise<any> => {
      return fetchWithAuth<any>('/nudges/evaluate', {
        method: 'POST',
      });
    },
    updateStatus: async (id: string, status: 'completed' | 'dismissed' | 'pending'): Promise<{ nudge: Nudge }> => {
      return fetchWithAuth<{ nudge: Nudge }>(`/nudges/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  },

  analytics: {
    getMetrics: async (): Promise<{ metrics: AnalyticsMetrics }> => {
      return fetchWithAuth<{ metrics: AnalyticsMetrics }>('/analytics');
    },
  },
};
