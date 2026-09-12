import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  FileText,
  Bell,
  UploadCloud,
  BarChart3,
  Bot,
  Database,
  RefreshCw,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onBenchmarkLoaded: () => void;
  pendingNudgesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onBenchmarkLoaded,
  pendingNudgesCount,
}) => {
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);
  const [benchmarkMsg, setBenchmarkMsg] = useState<string | null>(null);

  const handleLoadBenchmark = async () => {
    try {
      setLoadingBenchmark(true);
      const res = await fetch('/api/jobs/load-benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-user': 'true' },
      });
      const data = await res.json();
      setBenchmarkMsg('Loaded 12 jobs & 6 drafts!');
      onBenchmarkLoaded();
      setTimeout(() => setBenchmarkMsg(null), 4000);
    } catch (err: any) {
      alert('Error loading benchmark: ' + err.message);
    } finally {
      setLoadingBenchmark(false);
    }
  };

  const navItems = [
    { id: 'kanban', label: 'Pipeline Board', icon: Layers },
    { id: 'drafts', label: 'AI Draft Studio', icon: FileText },
    {
      id: 'nudges',
      label: 'Scheduled Nudges',
      icon: Bell,
      badge: pendingNudgesCount > 0 ? pendingNudgesCount : undefined,
    },
    { id: 'ingestion', label: 'Ingestion & Datasets', icon: UploadCloud },
    { id: 'analytics', label: 'Analytics & Funnel', icon: BarChart3 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">AI Job Pipeline</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                  Google Cloud
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" /> Gemini 2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Career Optimization & Scheduled Nudges</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 text-[11px] font-bold bg-amber-500 text-slate-950 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Benchmark Action Button & User info */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleLoadBenchmark}
              disabled={loadingBenchmark}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm hover:border-slate-600 disabled:opacity-50"
              title="Loads the 10+ standard evaluation job postings and historical drafts"
            >
              {loadingBenchmark ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              ) : benchmarkMsg ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Database className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>{benchmarkMsg || 'Seed 10+ Evaluation Jobs'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex overflow-x-auto border-t border-slate-800/80 px-2 py-1.5 space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
