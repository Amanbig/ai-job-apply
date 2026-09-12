import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Calendar,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  FileText,
  Send,
  MoreVertical,
  Briefcase,
  History,
  Plus
} from 'lucide-react';
import { Application, JobPosting } from '../types';

interface KanbanBoardProps {
  applications: Application[];
  onStatusChange: (applicationId: string, newStatus: string, note?: string) => Promise<void>;
  onOpenDraftStudio: (jobId: number, type: 'cover_letter' | 'follow_up_email') => void;
  onViewDetails: (application: Application) => void;
  onRefresh: () => void;
}

const STAGES = [
  {
    id: 'Applied',
    title: 'Applied',
    description: 'Awaiting recruiter review & response',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    headerBorder: 'border-blue-500/40',
    dotColor: 'bg-blue-400',
  },
  {
    id: 'Interview',
    title: 'Interview',
    description: 'Technical screenings & system rounds',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    headerBorder: 'border-amber-500/40',
    dotColor: 'bg-amber-400',
  },
  {
    id: 'Offer',
    title: 'Offer',
    description: 'Compensation negotiation & review',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    headerBorder: 'border-emerald-500/40',
    dotColor: 'bg-emerald-400',
  },
  {
    id: 'Reject',
    title: 'Reject',
    description: 'Archived or future talent pool',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    headerBorder: 'border-rose-500/40',
    dotColor: 'bg-rose-400',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onStatusChange,
  onOpenDraftStudio,
  onViewDetails,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  const filteredApps = applications.filter((app) => {
    const job = app.jobPosting;
    if (!job) return false;
    const matchesSearch =
      job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || job.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  const handleQuickTransition = async (appId: string, nextStatus: string) => {
    try {
      setTransitioningId(appId);
      await onStatusChange(appId, nextStatus, `Quick moved to ${nextStatus} via Kanban board`);
    } catch (err: any) {
      alert('Failed to update stage: ' + err.message);
    } finally {
      setTransitioningId(null);
    }
  };

  const getDaysAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day ago';
    return `${diff} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search role, company, or tech..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="contract">Contract</option>
            <option value="part-time">Part-time</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Active Pipeline: <strong className="text-white">{filteredApps.length}</strong> applications</span>
          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
          <span>4 State Phases</span>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {STAGES.map((stage) => {
          const stageApps = filteredApps.filter((a) => a.status === stage.id);

          return (
            <div
              key={stage.id}
              className={`flex flex-col bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden min-h-[580px] shadow-sm`}
            >
              {/* Column Header */}
              <div className={`p-3.5 bg-slate-900/80 border-b ${stage.headerBorder} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`}></span>
                  <h3 className="font-semibold text-sm text-white">{stage.title}</h3>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${stage.badgeClass}`}>
                    {stageApps.length}
                  </span>
                </div>
              </div>

              {/* Column Body / Application Cards */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {stageApps.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    No applications in {stage.title}
                  </div>
                ) : (
                  stageApps.map((app) => {
                    const job = app.jobPosting;
                    const daysAgo = getDaysAgo(app.appliedDate);
                    const daysAgoNum = Math.floor((Date.now() - new Date(app.appliedDate).getTime()) / 86400000);
                    const isInactive = app.status === 'Applied' && daysAgoNum >= 7;
                    const hasCoverLetter = app.drafts?.some((d) => d.type === 'cover_letter');
                    const hasFollowUp = app.drafts?.some((d) => d.type === 'follow_up_email');

                    return (
                      <div
                        key={app.id}
                        className="group bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 transition-all shadow-sm hover:shadow-md relative"
                      >
                        {/* Top: Company & Type */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 truncate">
                            <Building className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{job.company}</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {job.type}
                          </span>
                        </div>

                        {/* Role Title */}
                        <h4
                          onClick={() => onViewDetails(app)}
                          className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors cursor-pointer mb-2 line-clamp-1"
                          title={job.role}
                        >
                          {job.role}
                        </h4>

                        {/* Inactivity Warning Banner */}
                        {isInactive && (
                          <div className="mb-2 p-1.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5 text-[11px] text-amber-300">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Inactive for {daysAgoNum} days. Follow-up ready!</span>
                          </div>
                        )}

                        {/* Salary or Interview Callout if available */}
                        {app.salaryOffer && (
                          <div className="mb-2 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-300">
                            💰 Offer: {app.salaryOffer}
                          </div>
                        )}

                        {/* Tech Stack Chips */}
                        {job.techStack && job.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {job.techStack.slice(0, 3).map((t, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50"
                              >
                                {t}
                              </span>
                            ))}
                            {job.techStack.length > 3 && (
                              <span className="text-[10px] px-1 py-0.2 text-slate-500">
                                +{job.techStack.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Metadata Footer */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 mb-2.5">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" />
                            {daysAgo}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {hasCoverLetter && (
                              <span className="flex items-center gap-0.5 text-emerald-400 text-[10px]" title="Cover letter attached">
                                <FileText className="w-3 h-3" /> Letter
                              </span>
                            )}
                            {hasFollowUp && (
                              <span className="flex items-center gap-0.5 text-sky-400 text-[10px]" title="Follow-up draft exists">
                                <Send className="w-3 h-3" /> Email
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          <button
                            onClick={() => onOpenDraftStudio(job.id, app.status === 'Applied' && isInactive ? 'follow_up_email' : 'cover_letter')}
                            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>AI Draft</span>
                          </button>

                          <button
                            onClick={() => onViewDetails(app)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                            title="View application history & details"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Stage Progression */}
                          <div className="relative group/menu">
                            <select
                              value={app.status}
                              disabled={transitioningId === app.id}
                              onChange={(e) => handleQuickTransition(app.id, e.target.value)}
                              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 px-1.5 py-1 focus:outline-none cursor-pointer"
                              title="Transition application state"
                            >
                              <option value="Applied">Applied</option>
                              <option value="Interview">Interview</option>
                              <option value="Offer">Offer</option>
                              <option value="Reject">Reject</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
