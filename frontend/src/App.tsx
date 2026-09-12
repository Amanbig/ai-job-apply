import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { AIDraftStudio } from './components/AIDraftStudio';
import { NudgeCenter } from './components/NudgeCenter';
import { IngestionWizard } from './components/IngestionWizard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { JobDetailModal } from './components/JobDetailModal';
import { api } from './services/api';
import { Application, JobPosting, Nudge, AnalyticsMetrics } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('kanban');
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal and studio navigation state
  const [selectedAppForModal, setSelectedAppForModal] = useState<Application | null>(null);
  const [studioJobId, setStudioJobId] = useState<number | undefined>(undefined);
  const [studioDraftType, setStudioDraftType] = useState<'cover_letter' | 'follow_up_email'>('cover_letter');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, jobsRes, nudgesRes, metricsRes] = await Promise.all([
        api.applications.getAll(),
        api.jobs.getAll(),
        api.nudges.getAll(),
        api.analytics.getMetrics(),
      ]);

      setApplications(appsRes.applications);
      setJobs(jobsRes.postings);
      setNudges(nudgesRes.nudges);
      setMetrics(metricsRes.metrics);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (applicationId: string, newStatus: string, note?: string) => {
    await api.applications.updateStatus(applicationId, { status: newStatus, note });
    await fetchData();

    // If modal is open, refresh the selected app
    if (selectedAppForModal && selectedAppForModal.id === applicationId) {
      const updated = await api.applications.getById(applicationId);
      setSelectedAppForModal(updated.application);
    }
  };

  const handleOpenDraftStudio = (jobId: number, type: 'cover_letter' | 'follow_up_email') => {
    setStudioJobId(jobId);
    setStudioDraftType(type);
    setCurrentTab('drafts');
  };

  const pendingNudgesCount = nudges.filter((n) => n.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onBenchmarkLoaded={fetchData}
        pendingNudgesCount={pendingNudgesCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Connecting to PostgreSQL & Google GenAI pipeline...</p>
          </div>
        ) : (
          <>
            {currentTab === 'kanban' && (
              <KanbanBoard
                applications={applications}
                onStatusChange={handleStatusChange}
                onOpenDraftStudio={handleOpenDraftStudio}
                onViewDetails={(app) => setSelectedAppForModal(app)}
                onRefresh={fetchData}
              />
            )}

            {currentTab === 'drafts' && (
              <AIDraftStudio
                jobs={jobs}
                selectedJobId={studioJobId}
                initialType={studioDraftType}
                onDraftSaved={fetchData}
              />
            )}

            {currentTab === 'nudges' && (
              <NudgeCenter
                nudges={nudges}
                onRefreshNudges={fetchData}
                onOpenDraftStudio={handleOpenDraftStudio}
              />
            )}

            {currentTab === 'ingestion' && (
              <IngestionWizard onIngestionComplete={fetchData} />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsDashboard metrics={metrics} />
            )}
          </>
        )}
      </main>

      {/* Persistent Status Transition Modal */}
      <JobDetailModal
        application={selectedAppForModal}
        onClose={() => setSelectedAppForModal(null)}
        onStatusChange={handleStatusChange}
        onOpenDraftStudio={handleOpenDraftStudio}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        AI Job Application Tracker • Powered by Google Cloud & Gemini 2.5 • PostgreSQL Pipeline
      </footer>
    </div>
  );
}

export default App;
