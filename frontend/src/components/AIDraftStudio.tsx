import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  FileText,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  Briefcase,
  ChevronDown,
  Cpu,
  Download,
  Share2,
  ThumbsUp,
  Hash,
  Clock,
  Sliders
} from 'lucide-react';
import { JobPosting, Draft } from '../types';

interface AIDraftStudioProps {
  jobs: JobPosting[];
  selectedJobId?: number;
  initialType?: 'cover_letter' | 'follow_up_email';
  onDraftSaved: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AIDraftStudio: React.FC<AIDraftStudioProps> = ({
  jobs,
  selectedJobId,
  initialType = 'cover_letter',
  onDraftSaved,
  showToast,
}) => {
  const [activeJobId, setActiveJobId] = useState<number>(selectedJobId || (jobs[0]?.id ?? 1));
  const [draftType, setDraftType] = useState<'cover_letter' | 'follow_up_email'>(initialType);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [tone, setTone] = useState<'professional' | 'technical' | 'conversational'>('professional');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generated draft state
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);
  const [draftContent, setDraftContent] = useState<string>('');
  const [atsScore, setAtsScore] = useState<number>(92);
  const [analysis, setAnalysis] = useState<any>(null);
  const [historicalDrafts, setHistoricalDrafts] = useState<Draft[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (selectedJobId) {
      setActiveJobId(selectedJobId);
    }
  }, [selectedJobId]);

  useEffect(() => {
    if (initialType) {
      setDraftType(initialType);
    }
  }, [initialType]);

  useEffect(() => {
    loadJobDrafts(activeJobId);
  }, [activeJobId]);

  const loadJobDrafts = async (jobId: number) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/drafts?jobId=${jobId}`, {
        headers: { 'x-demo-user': 'true' },
      });
      const data = await res.json();
      const existing = data.drafts?.find((d: Draft) => d.type === draftType) || data.drafts?.[0];

      if (existing) {
        setActiveDraft(existing);
        setDraftContent(existing.contents);
        setAtsScore(existing.atsScore || 92);
        setAnalysis(existing.analysis);
      } else {
        setActiveDraft(null);
        setDraftContent('');
        setAnalysis(null);
      }

      const allRes = await fetch('/api/drafts', {
        headers: { 'x-demo-user': 'true' },
      });
      const allData = await allRes.json();
      setHistoricalDrafts(allData.drafts || []);
    } catch (err) {
      console.error('Failed to load drafts:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const combinedInstructions = [
        tone !== 'professional' ? `Tone: ${tone}` : '',
        customInstructions,
      ].filter(Boolean).join('. ');

      const res = await fetch('/api/drafts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-user': 'true' },
        body: JSON.stringify({
          jobId: activeJobId,
          type: draftType,
          customInstructions: combinedInstructions,
          modelOverride: selectedModel,
        }),
      });

      const data = await res.json();
      if (data.draft) {
        setActiveDraft(data.draft);
        setDraftContent(data.draft.contents);
        setAtsScore(data.generationMeta?.atsScore || 92);
        setAnalysis(data.generationMeta?.analysis);
        onDraftSaved();
        if (showToast) showToast('Generated tailored draft successfully!', 'success');
      }
    } catch (err: any) {
      alert('Generation error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async (newStatus?: string) => {
    if (!activeDraft) return;
    try {
      const res = await fetch(`/api/drafts/${activeDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-demo-user': 'true' },
        body: JSON.stringify({
          contents: draftContent,
          status: newStatus || activeDraft.status,
          atsScore,
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setActiveDraft(data.draft);
        onDraftSaved();
        if (showToast) showToast(`Draft updated & marked as ${newStatus || activeDraft.status}!`, 'success');
      }
    } catch (err: any) {
      alert('Failed to save draft: ' + err.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draftContent);
    setCopied(true);
    if (showToast) showToast('Draft copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([draftContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${currentJob?.company || 'Application'}_${draftType}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const wordCount = draftContent ? draftContent.trim().split(/\s+/).length : 0;
  const readingTimeSec = Math.ceil((wordCount / 200) * 60);

  const currentJob = jobs.find((j) => j.id === activeJobId) || jobs[0];

  return (
    <div className="space-y-6">
      {/* Studio Header & Configuration Controls */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">AI Draft & Generation Studio</h2>
              <span className="px-2 py-0.5 text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full font-medium">
                Context-Informed RAG
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Synthesizes tailored cover letters & follow-ups using Google Gemini and candidate historical draft patterns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Model Selector */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-slate-400">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Latest)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="offline-fallback">Contextual Heuristic (Offline)</option>
              </select>
            </div>

            {/* Target Job Selector */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <select
                value={activeJobId}
                onChange={(e) => setActiveJobId(Number(e.target.value))}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer max-w-[220px] truncate"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    #{job.id} - {job.company} ({job.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Draft Type Switcher */}
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setDraftType('cover_letter')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  draftType === 'cover_letter'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cover Letter
              </button>
              <button
                onClick={() => setDraftType('follow_up_email')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  draftType === 'follow_up_email'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Follow-up Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Job Context & Historical Draft Memory */}
        <div className="lg:col-span-4 space-y-4">
          {/* Target Job Card */}
          {currentJob && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold">JOB #{currentJob.id}</span>
                  <h3 className="font-bold text-slate-100 text-sm mt-0.5">{currentJob.role}</h3>
                  <p className="text-xs text-slate-400">{currentJob.company} • {currentJob.location || 'Remote'}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                  {currentJob.type}
                </span>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed max-h-32 overflow-y-auto">
                {currentJob.description}
              </div>

              {currentJob.techStack && currentJob.techStack.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {currentJob.techStack.map((tech, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Historical Drafts Memory List */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Historical Memory Context
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {historicalDrafts.length} drafts indexed
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              The AI references these past high-converting entries to mirror your professional voice and key architectural wins.
            </p>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {historicalDrafts.slice(0, 4).map((hDraft) => (
                <div
                  key={hDraft.id}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-indigo-300 capitalize">
                      Draft #{hDraft.id} ({hDraft.type.replace('_', ' ')})
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ATS: {hDraft.atsScore || 90}%
                    </span>
                  </div>
                  <p className="text-slate-400 line-clamp-2 text-[11px] italic">
                    "{hDraft.contents}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tone & Custom Prompt Note */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target Tone</span>
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                {(['professional', 'technical', 'conversational'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`py-1 rounded capitalize font-medium transition ${
                      tone === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 block">
                Focus Directives (Optional)
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Emphasize low-latency gRPC APIs, mention scaling to 250k events/sec..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Generate Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Tailored Draft...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Generate Contextual {draftType === 'cover_letter' ? 'Cover Letter' : 'Follow-up Email'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Generation Canvas & ATS Auditor */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
            {/* Header & Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-sm text-white">
                  {draftType === 'cover_letter' ? 'Cover Letter Canvas' : 'Follow-up Email Canvas'}
                </span>
                {activeDraft && (
                  <span className="px-2 py-0.5 text-[10px] uppercase font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Status: {activeDraft.status}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!draftContent}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-40"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!draftContent}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => handleSaveDraft('reviewed')}
                  disabled={!draftContent}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition disabled:opacity-40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mark Reviewed</span>
                </button>

                <button
                  onClick={() => handleSaveDraft('sent')}
                  disabled={!draftContent}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Mark Sent</span>
                </button>
              </div>
            </div>

            {/* Content Stats Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-3 font-mono">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {wordCount} words ({draftContent.length} chars)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ~{readingTimeSec}s read
                </span>
              </div>
              {activeDraft?.modelUsed && (
                <span className="text-slate-400">
                  Synthesized via: <strong className="text-indigo-400 font-mono">{activeDraft.modelUsed}</strong>
                </span>
              )}
            </div>

            {/* Editable Content Canvas */}
            <div className="relative">
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Click 'Generate Contextual Draft' to synthesize a tailored cover letter or follow-up email, or write your draft here..."
                rows={13}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans resize-y shadow-inner"
              />
            </div>

            {/* ATS Score & Keyword Alignment Widget */}
            {analysis && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      ATS Keyword & Role Alignment Score
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full"
                        style={{ width: `${atsScore}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{atsScore}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Key Strengths & Matched Requirements:</span>
                    <ul className="space-y-1">
                      {analysis.strengths?.map((s: string, i: number) => (
                        <li key={i} className="flex items-center gap-1.5 text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Identified Technical Keywords:</span>
                    <div className="flex flex-wrap gap-1">
                      {analysis.matchedKeywords?.map((k: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
