import React, { useState } from 'react';
import {
  X,
  Building,
  Briefcase,
  Calendar,
  Layers,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { api } from '../services/api';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AddApplicationModal: React.FC<AddApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [type, setType] = useState('full-time');
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Applied');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setError('Company and Role are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Create Job Posting
      const fullDescription = description.trim()
        ? `${role} at ${company}. ${description.trim()}`
        : `${role} at ${company}, Remote. High-scale production systems.`;

      const jobRes = await api.jobs.create({
        from: appliedDate,
        to: new Date(Date.now() + 30 * 86400000).toISOString(),
        type,
        description: fullDescription,
      });

      // 2. Set Status and Notes
      if (jobRes.posting.applications?.[0]?.id) {
        await api.applications.updateStatus(jobRes.posting.applications[0].id, {
          status,
          note: notes || `Application logged directly into ${status} stage`,
        });
      }

      if (showToast) showToast(`Application for ${company} logged in ${status}!`, 'success');
      onSuccess();
      onClose();

      // Reset form
      setCompany('');
      setRole('');
      setDescription('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to log application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Log Active Job Application</h3>
              <p className="text-xs text-slate-400">Detail target company, role, date, and pipeline phase</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 block">Target Company *</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, Anthropic"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 block">Specific Role *</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 block">Application Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 block">Job Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="full-time">Full-time</option>
                <option value="contract">Contract</option>
                <option value="part-time">Part-time</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 block">Initial Phase</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
              >
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Reject">Reject</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 block">
              Job Description & Key Tech Requirements (Used by Gemini for Tailoring)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste requirements, tech stack (Python, Kubernetes, Kafka, etc.) to inform the AI draft generator..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 block">Notes & Interview Tracking (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Referred by tech lead, scheduled screening next Tuesday..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {submitting ? 'Logging...' : 'Log Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
