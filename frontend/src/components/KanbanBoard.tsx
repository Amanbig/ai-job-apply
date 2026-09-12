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
  Plus,
  Filter,
  Search,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Application, JobPosting } from '../types';

interface KanbanBoardProps {
  applications: Application[];
  onStatusChange: (applicationId: string, newStatus: string, note?: string) => Promise<void>;
  onOpenDraftStudio: (jobId: number, type: 'cover_letter' | 'follow_up_email') => void;
  onViewDetails: (application: Application) => void;
  onRefresh: () => void;
  onSeedBenchmark?: () => void;
  onOpenAddModal?: () => void;
}

const STAGES = [
  {
    id: 'Applied',
    title: 'Applied',
    subtitle: 'Awaiting recruiter review & response',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    headerBorder: 'border-blue-500/40',
    dotColor: 'bg-blue-400',
  },
  {
    id: 'Interview',
    title: 'Interview',
    subtitle: 'Technical screenings & system rounds',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    headerBorder: 'border-amber-500/40',
    dotColor: 'bg-amber-400',
  },
  {
    id: 'Offer',
    title: 'Offer',
    subtitle: 'Compensation review & decision window',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    headerBorder: 'border-emerald-500/40',
    dotColor: 'bg-emerald-400',
  },
  {
    id: 'Reject',
    title: 'Reject',
    subtitle: 'Archived / future hiring pipeline',
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
  onSeedBenchmark,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [urgencyOnly, setUrgencyOnly] = useState(false);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  const filteredApps = applications.filter((app) => {
    const job = app.jobPosting;
    if (!job) return false;
    const matchesSearch =
      job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || job.type.toLowerCase() === typeFilter.toLowerCase();
    
    const daysAgoNum = Math.floor((Date.now() - new Date(app.appliedDate).getTime()) / 86400000);
    const isUrgent = app.status === 'Applied' && daysAgoNum >= 7;
    const matchesUrgency = !urgencyOnly || isUrgent;

    return matchesSearch && matchesType && matchesUrgency;
  });

  const handleQuickTransition = async (appId: string, nextStatus: string) => {
    try {
      setTransitioningId(appId);
      await onStatusChange(appId, nextStatus, `Transitioned stage to ${nextStatus}`);
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

  const urgentCount = applications.filter((a) => {
    const diff = Math.floor((Date.now() - new Date(a.appliedDate).getTime()) / 86400000);
    return a.status === 'Applied' && diff >= 7;
  }).length;

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/90 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          {/* Add Application Button */}
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Application</span>
            </button>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search company, role, tech stack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-60 sm:w-72 transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            {['all', 'full-time', 'contract'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition ${
                  typeFilter === t
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {urgentCount > 0 && (
            <button
              onClick={() => setUrgencyOnly(!urgencyOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                urgencyOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-950 text-amber-400 border-slate-800 hover:border-amber-500/30'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Needs Follow-up ({urgentCount})</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 text-xs text-slate-400">
          <span>Active Pipeline: <strong className="text-white font-mono">{filteredApps.length}</strong> applications</span>
          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
          <span className="text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> State Persistent
          </span>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {STAGES.map((stage) => {
          const stageApps = filteredApps.filter((a) => a.status === stage.id);

          return (
            <div
              key={stage.id}
              className="flex flex-col bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden min-h-[620px] shadow-sm hover:border-slate-750 transition"
            >
              {/* Stage Header */}
              <div className={`p-3.5 bg-slate-900/80 border-b ${stage.headerBorder} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`}></span>
                  <h3 className="font-semibold text-sm text-white">{stage.title}</h3>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${stage.badgeClass}`}>
                    {stageApps.length}
                  </span>
                </div>
              </div>

              {/* Stage Applications Cards */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {stageApps.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-500 border border-dashed border-slate-800/80 rounded-xl space-y-2">
                    <p>No active entries in {stage.title}</p>
                    {applications.length === 0 && onSeedBenchmark && (
                      <button
                        onClick={onSeedBenchmark}
                        className="px-3 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-medium"
                      >
                        Load Evaluation Dataset
                      </button>
                    )}
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
                        className={`group bg-slate-900/90 hover:bg-slate-850 border rounded-xl p-3.5 transition-all shadow-sm hover:shadow-md relative ${
                          isInactive ? 'border-amber-500/40' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Top Bar: Company & Type */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 flex-1 min-w-0">
                            <Building className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-bold text-slate-200 group-hover:text-indigo-300 transition truncate">
                              {job.company}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700 shrink-0">
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

                        {/* Dormancy / Inactivity Alert Callout */}
                        {isInactive && (
                          <div className="mb-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-[11px] text-amber-300">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1 flex-1">
                              <span><strong>{daysAgoNum} days</strong> without response. Follow-up nudge active!</span>
                              <button
                                onClick={() => onOpenDraftStudio(job.id, 'follow_up_email')}
                                className="text-[10px] font-semibold text-amber-400 hover:underline flex items-center gap-1"
                              >
                                Review Follow-up Draft &rarr;
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Salary or Interview Callout if available */}
                        {app.salaryOffer && (
                          <div className="mb-2 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Offer: {app.salaryOffer}</span>
                          </div>
                        )}

                        {/* Tech Stack Chips */}
                        {job.techStack && job.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {job.techStack.slice(0, 3).map((t, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-400 border border-slate-700/50"
                              >
                                {t}
                              </span>
                            ))}
                            {job.techStack.length > 3 && (
                              <span className="text-[10px] px-1 py-0.2 text-slate-500 font-mono">
                                +{job.techStack.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Metadata Footer */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 mb-2.5">
                          <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                            <Clock className="w-3 h-3" />
                            {daysAgo}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {hasCoverLetter && (
                              <span className="flex items-center gap-0.5 text-emerald-400 text-[10px]" title="Tailored Cover Letter Attached">
                                <FileText className="w-3 h-3" /> Letter
                              </span>
                            )}
                            {hasFollowUp && (
                              <span className="flex items-center gap-0.5 text-sky-400 text-[10px]" title="Follow-up email available">
                                <Send className="w-3 h-3" /> Email
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          <button
                            onClick={() =>
                              onOpenDraftStudio(
                                job.id,
                                app.status === 'Applied' && isInactive ? 'follow_up_email' : 'cover_letter'
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>AI Studio</span>
                          </button>

                          <button
                            onClick={() => onViewDetails(app)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                            title="View history & audit log"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Stage Transition Dropdown */}
                          <select
                            value={app.status}
                            disabled={transitioningId === app.id}
                            onChange={(e) => handleQuickTransition(app.id, e.target.value)}
                            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 px-2 py-1.5 focus:outline-none cursor-pointer"
                            title="Change pipeline phase"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Interview">Interview</option>
                            <option value="Offer">Offer</option>
                            <option value="Reject">Reject</option>
                          </select>
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
