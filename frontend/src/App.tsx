import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { AIDraftStudio } from './components/AIDraftStudio';
import { NudgeCenter } from './components/NudgeCenter';
import { IngestionWizard } from './components/IngestionWizard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { JobDetailModal } from './components/JobDetailModal';
import { AuthModal } from './components/AuthModal';
import { AddApplicationModal } from './components/AddApplicationModal';
import { LandingGateway } from './components/LandingGateway';
import { ToastContainer, ToastMessage } from './components/Toast';
import { api } from './services/api';
import { Application, JobPosting, Nudge, AnalyticsMetrics } from './types';

function MainApp() {
  const { user, isLoading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('kanban');
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal and studio navigation state
  const [selectedAppForModal, setSelectedAppForModal] = useState<Application | null>(null);
  const [studioJobId, setStudioJobId] = useState<number | undefined>(undefined);
  const [studioDraftType, setStudioDraftType] = useState<'cover_letter' | 'follow_up_email'>('cover_letter');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [addAppModalOpen, setAddAppModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = async () => {
    if (!user) return;
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
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      if (err.message?.includes('Unauthorized')) {
        showToast('Session expired. Please sign in again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setApplications([]);
      setJobs([]);
      setNudges([]);
      setMetrics(null);
    }
  }, [user]);

  const handleStatusChange = async (applicationId: string, newStatus: string, note?: string) => {
    try {
      await api.applications.updateStatus(applicationId, { status: newStatus, note });
      showToast(`Application transitioned to ${newStatus}!`, 'success');
      await fetchData();

      if (selectedAppForModal && selectedAppForModal.id === applicationId) {
        const updated = await api.applications.getById(applicationId);
        setSelectedAppForModal(updated.application);
      }
    } catch (err: any) {
      showToast(`Failed to update status: ${err.message}`, 'error');
    }
  };

  const handleOpenDraftStudio = (jobId: number, type: 'cover_letter' | 'follow_up_email') => {
    setStudioJobId(jobId);
    setStudioDraftType(type);
    setCurrentTab('drafts');
  };

  const openAuthWithMode = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const pendingNudgesCount = nudges.filter((n) => n.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingNudgesCount={pendingNudgesCount}
        onOpenAuthModal={openAuthWithMode}
      />

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {authLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Verifying security token...</p>
          </div>
        ) : !user ? (
          /* Unauthenticated Landing Gateway - Requires Login */
          <LandingGateway
            onOpenAuthModal={openAuthWithMode}
          />
        ) : loading && applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Syncing active applications with PostgreSQL...</p>
          </div>
        ) : (
          /* Protected Authenticated Views */
          <>
            {currentTab === 'kanban' && (
              <KanbanBoard
                applications={applications}
                onStatusChange={handleStatusChange}
                onOpenDraftStudio={handleOpenDraftStudio}
                onViewDetails={(app) => setSelectedAppForModal(app)}
                onRefresh={fetchData}
                onOpenAddModal={() => setAddAppModalOpen(true)}
                onSeedBenchmark={async () => {
                  await api.jobs.loadBenchmark();
                  await fetchData();
                  showToast('Loaded benchmark evaluation dataset!', 'success');
                }}
              />
            )}

            {currentTab === 'drafts' && (
              <AIDraftStudio
                jobs={jobs}
                selectedJobId={studioJobId}
                initialType={studioDraftType}
                onDraftSaved={fetchData}
                showToast={showToast}
              />
            )}

            {currentTab === 'nudges' && (
              <NudgeCenter
                nudges={nudges}
                onRefreshNudges={fetchData}
                onOpenDraftStudio={handleOpenDraftStudio}
                showToast={showToast}
              />
            )}

            {currentTab === 'ingestion' && (
              <IngestionWizard
                onIngestionComplete={fetchData}
                showToast={showToast}
              />
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

      {/* Strict Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          fetchData();
          showToast('Signed in successfully!', 'success');
        }}
      />

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={addAppModalOpen}
        onClose={() => setAddAppModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
        showToast={showToast}
      />

      {/* Floating Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        AI Job Application Tracker • Google Cloud & Gemini 2.5 • PostgreSQL Pipeline
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
