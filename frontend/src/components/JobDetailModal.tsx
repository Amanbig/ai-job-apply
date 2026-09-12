import React, { useState } from 'react';
import {
  X,
  Building,
  Calendar,
  Clock,
  Sparkles,
  History,
  FileText,
  Send,
  CheckCircle2,
  DollarSign,
  Edit3
} from 'lucide-react';
import { Application, StatusTransitionLog } from '../types';

interface JobDetailModalProps {
  application: Application | null;
  onClose: () => void;
  onStatusChange: (applicationId: string, newStatus: string, note?: string) => Promise<void>;
  onOpenDraftStudio: (jobId: number, type: 'cover_letter' | 'follow_up_email') => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  application,
  onClose,
  onStatusChange,
  onOpenDraftStudio,
}) => {
  if (!application) return null;

  const job = application.jobPosting;
  const [selectedStatus, setSelectedStatus] = useState(application.status);
  const [note, setNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (selectedStatus === application.status && !note) return;
    try {
      setIsUpdating(true);
      await onStatusChange(application.id, selectedStatus, note);
      setNote('');
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-indigo-400">JOB #{job.id}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {job.type}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{job.role}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>{job.company}</span> • <span>{job.location || 'Remote'}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5">
          {/* Status Progression Bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Application Pipeline Phase
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Applied', 'Interview', 'Offer', 'Reject'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st as any)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition border ${
                    selectedStatus === st
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Note input on change */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add transition log note (e.g. Cleared round 2, received written offer)..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleUpdate}
                disabled={isUpdating || (selectedStatus === application.status && !note)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition"
              >
                {isUpdating ? 'Saving...' : 'Update Stage'}
              </button>
            </div>
          </div>

          {/* Job Description & Tech Stack */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Posting Requirements & Description
            </h4>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
              {job.description}
            </div>
            {job.techStack && job.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {job.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Linked Drafts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tailored Cover Letters & Email Drafts
              </h4>
              <button
                onClick={() => {
                  onClose();
                  onOpenDraftStudio(job.id, 'cover_letter');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3 h-3" />
                <span>Open AI Studio</span>
              </button>
            </div>

            {application.drafts && application.drafts.length > 0 ? (
              <div className="space-y-2">
                {application.drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-300 capitalize">
                        {draft.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {draft.status}
                      </span>
                    </div>
                    <p className="text-slate-400 line-clamp-2 italic text-[11px]">
                      "{draft.contents}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 p-3 text-center text-xs text-slate-500 rounded-xl border border-slate-800">
                No drafts generated yet for this posting.
              </div>
            )}
          </div>

          {/* Persistent State Transition Audit Logs */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Persistent State Transition History</span>
            </h4>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 max-h-36 overflow-y-auto">
              {application.statusLogs && application.statusLogs.length > 0 ? (
                application.statusLogs.map((log) => (
                  <div key={log.id} className="text-xs flex items-start gap-2 border-b border-slate-900 pb-1.5 last:border-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">
                          {log.fromStatus} → {log.toStatus}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.changedAt).toLocaleString()}
                        </span>
                      </div>
                      {log.note && <p className="text-[11px] text-slate-400 mt-0.5">{log.note}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center">No transition records logged yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
