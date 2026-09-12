import React from 'react';
import {
  Sparkles,
  Layers,
  FileText,
  Bell,
  UploadCloud,
  CheckCircle2,
  Lock,
  ArrowRight,
  Cpu,
  Database,
  TrendingUp,
  ShieldCheck,
  LogIn
} from 'lucide-react';

interface LandingGatewayProps {
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
}

export const LandingGateway: React.FC<LandingGatewayProps> = ({
  onOpenAuthModal,
}) => {
  return (
    <div className="min-h-[85vh] flex flex-col justify-between">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center pt-8 pb-12 px-4 space-y-6">
        {/* Badges */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-medium">Google Code Kitchen Challenge</span>
          <span className="text-slate-600">•</span>
          <span className="text-indigo-400 font-mono font-medium flex items-center gap-1">
            <Cpu className="w-3 h-3" /> Gemini 2.5 & Google Cloud Run
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-none">
          Smart Career Optimization Pipeline & <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
            Application Tracking Dashboard
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Log active job applications across persistent phases (Applied, Interview, Offer, Reject).
          Dynamically generate tailored cover letters informed by past historical drafts, and trigger automated scheduled nudges.
        </p>

        {/* Authentication Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onOpenAuthModal('login')}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenAuthModal('register')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition shadow-sm cursor-pointer"
          >
            Create Candidate Account
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2 font-mono">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> JWT Bearer Security</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-indigo-400" /> PostgreSQL 16 Persistence</span>
        </div>
      </div>

      {/* Feature Pillar Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-2.5 backdrop-blur-md">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-white">4-Phase Pipeline Board</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Persistent state transitions across Applied, Interview, Offer, and Reject stages with complete historical audit logging.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-2.5 backdrop-blur-md">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-white">Historical AI Draft Studio</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Synthesizes tailored cover letters & follow-ups using candidate historical drafts as few-shot in-context memory.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-2.5 backdrop-blur-md">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bell className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-white">Automated Scheduled Nudges</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Background cron worker alerts candidates on dormancy (&ge; 7 days), upcoming interviews, and offer decision timelines.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-2.5 backdrop-blur-md">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UploadCloud className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-white">Evaluation Ingestion Hub</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Batch streaming CSV parser for 10+ job postings and associated drafts matching exact challenge specifications.
          </p>
        </div>
      </div>
    </div>
  );
};
