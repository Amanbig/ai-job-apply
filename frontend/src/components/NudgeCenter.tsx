import React, { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Send,
  Calendar,
  RefreshCw,
  XCircle,
  Building,
  Check,
  CalendarDays
} from 'lucide-react';
import { Nudge } from '../types';

interface NudgeCenterProps {
  nudges: Nudge[];
  onRefreshNudges: () => void;
  onOpenDraftStudio: (jobId: number, type: 'cover_letter' | 'follow_up_email') => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const NudgeCenter: React.FC<NudgeCenterProps> = ({
  nudges,
  onRefreshNudges,
  onOpenDraftStudio,
  showToast,
}) => {
  const [evaluating, setEvaluating] = useState(false);
  const [evalResultMsg, setEvalResultMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRunEvaluationPass = async () => {
    try {
      setEvaluating(true);
      const res = await fetch('/api/nudges/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-user': 'true' },
      });
      const data = await res.json();
      setEvalResultMsg(data.message || 'Evaluated applications for nudges.');
      onRefreshNudges();
      if (showToast) showToast('Scheduled nudge evaluation completed!', 'success');
      setTimeout(() => setEvalResultMsg(null), 5000);
    } catch (err: any) {
      alert('Error triggering nudge evaluation: ' + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const handleUpdateStatus = async (nudgeId: string, status: 'completed' | 'dismissed') => {
    try {
      setUpdatingId(nudgeId);
      const res = await fetch(`/api/nudges/${nudgeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-demo-user': 'true' },
        body: JSON.stringify({ status }),
      });
      await res.json();
      onRefreshNudges();
      if (showToast) showToast(`Nudge marked as ${status}!`, 'info');
    } catch (err: any) {
      alert('Failed to update nudge: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredNudges = nudges.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.status === activeFilter;
  });

  const pendingCount = nudges.filter((n) => n.status === 'pending').length;
  const completedCount = nudges.filter((n) => n.status === 'completed').length;

  const getNudgeMeta = (type: string) => {
    switch (type) {
      case 'follow_up_reminder':
        return {
          icon: Clock,
          label: 'Follow-up Nudge',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          urgency: 'High Urgency',
          dot: 'bg-amber-400',
        };
      case 'prep_interview':
        return {
          icon: Sparkles,
          label: 'Interview Prep',
          badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          urgency: 'Medium Urgency',
          dot: 'bg-indigo-400',
        };
      case 'offer_decision':
        return {
          icon: CheckCircle2,
          label: 'Offer Negotiation',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          urgency: 'High Urgency',
          dot: 'bg-emerald-400',
        };
      default:
        return {
          icon: AlertCircle,
          label: 'Application Alert',
          badgeClass: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
          urgency: 'Standard',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Automated Scheduler Controls */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Scheduled Candidate Nudges</h2>
              <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-medium">
                Cron Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated rules monitor application dormancy, upcoming interviews, and offer decision windows.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunEvaluationPass}
              disabled={evaluating}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
              <span>Run Scheduler Pass Now</span>
            </button>
          </div>
        </div>

        {evalResultMsg && (
          <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-indigo-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{evalResultMsg}</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeFilter === 'pending'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Pending Action ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeFilter === 'completed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            All History ({nudges.length})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          {filteredNudges.length} Nudges listed
        </span>
      </div>

      {/* Nudges List */}
      <div className="space-y-3">
        {filteredNudges.length === 0 ? (
          <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-12 text-center">
            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No {activeFilter} nudges at this time.</p>
            <p className="text-xs text-slate-500 mt-1">
              The automated engine will schedule proactive reminders as applications age or transition stages.
            </p>
          </div>
        ) : (
          filteredNudges.map((nudge) => {
            const meta = getNudgeMeta(nudge.type);
            const Icon = meta.icon;
            const app = nudge.application;
            const job = app?.jobPosting;

            return (
              <div
                key={nudge.id}
                className={`bg-slate-900/60 border rounded-xl p-4 transition-all ${
                  nudge.status === 'pending'
                    ? 'border-slate-800 hover:border-slate-750 bg-slate-900/90 shadow-sm'
                    : 'border-slate-900 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 shrink-0 mt-0.5 shadow-sm">
                      <Icon className="w-4 h-4 text-indigo-400" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${meta.badgeClass}`}>
                          {meta.label}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400 border border-slate-800 px-1.5 py-0.2 rounded bg-slate-950">
                          {meta.urgency}
                        </span>

                        {job && (
                          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-500" />
                            {job.company} — {job.role}
                          </span>
                        )}

                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(nudge.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed">
                        {nudge.message}
                      </p>

                      <div className="text-[11px] text-slate-500 italic">
                        Rule: {nudge.triggerReason}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {nudge.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {job && (
                        <button
                          onClick={() => onOpenDraftStudio(job.id, 'follow_up_email')}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>Review Draft</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleUpdateStatus(nudge.id, 'completed')}
                        disabled={updatingId === nudge.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition"
                        title="Mark nudge as resolved"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Done</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(nudge.id, 'dismissed')}
                        disabled={updatingId === nudge.id}
                        className="p-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                        title="Dismiss alert"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {nudge.status === 'completed' && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
