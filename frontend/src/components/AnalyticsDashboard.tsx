import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Bell,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AnalyticsMetrics } from '../types';

interface AnalyticsDashboardProps {
  metrics: AnalyticsMetrics | null;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="text-center py-20 text-slate-500">
        Loading analytics metrics...
      </div>
    );
  }

  const {
    totalApplications,
    stageCounts,
    interviewRate,
    offerRate,
    draftsTotal,
    draftsByStatus,
    draftsByType,
    avgAtsScore,
    nudgesTotal,
    nudgesByStatus,
  } = metrics;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Tracked Jobs</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalApplications}</span>
            <span className="text-xs text-slate-400">across 4 phases</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Interview Rate</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{interviewRate}%</span>
            <span className="text-xs text-slate-400">conversion rate</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Offer Win Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{offerRate}%</span>
            <span className="text-xs text-slate-400">final conversion</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Avg ATS Match</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-400">{avgAtsScore}%</span>
            <span className="text-xs text-slate-400">AI keyword score</span>
          </div>
        </div>
      </div>

      {/* Funnel Breakdown & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Stage Funnel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Career Pipeline Conversion Funnel</span>
            </h3>
            <span className="text-xs text-slate-400">4 State Stages</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Applied Stage', count: stageCounts.Applied, color: 'bg-blue-500', bar: 'bg-blue-500' },
              { label: 'Interview Stage', count: stageCounts.Interview, color: 'bg-amber-500', bar: 'bg-amber-500' },
              { label: 'Offer Received', count: stageCounts.Offer, color: 'bg-emerald-500', bar: 'bg-emerald-500' },
              { label: 'Rejected / Archived', count: stageCounts.Reject, color: 'bg-rose-500', bar: 'bg-rose-500' },
            ].map((stage) => {
              const pct = totalApplications > 0 ? Math.round((stage.count / totalApplications) * 100) : 0;
              return (
                <div key={stage.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{stage.label}</span>
                    <span className="font-mono text-slate-400">
                      {stage.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`${stage.bar} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Draft & Scheduled Nudges Efficiency */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>AI Drafts & Scheduled Nudges Velocity</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block">Total Drafts</span>
              <span className="text-xl font-bold text-white">{draftsTotal}</span>
              <div className="text-[11px] text-slate-500">
                {draftsByType.cover_letter} Letters • {draftsByType.follow_up_email} Follow-ups
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block">Sent / Reviewed</span>
              <span className="text-xl font-bold text-emerald-400">
                {draftsByStatus.sent + draftsByStatus.reviewed}
              </span>
              <div className="text-[11px] text-slate-500">
                {draftsByStatus.draft} in active editing
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block">Active Nudges</span>
              <span className="text-xl font-bold text-amber-400">{nudgesByStatus.pending}</span>
              <div className="text-[11px] text-slate-500">Automated proactive alerts</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block">Resolved Nudges</span>
              <span className="text-xl font-bold text-indigo-400">{nudgesByStatus.completed}</span>
              <div className="text-[11px] text-slate-500">Actions carried out</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
