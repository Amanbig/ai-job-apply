import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
  FileCode,
  Copy,
  Check,
  Table
} from 'lucide-react';

import { api } from '../services/api';

interface IngestionWizardProps {
  onIngestionComplete: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const SAMPLE_POSTINGS_CSV = `id, from, to, type, description
1, 2026-06-01, 2026-06-30, full-time, Senior Backend Engineer - Python, Bengaluru. Scale distributed microservices with FastAPI and PostgreSQL.
2, 2026-06-10, 2026-07-10, contract, Data Platform Engineer - streaming pipelines, Remote. Real-time Kafka and Apache Flink analytics.
3, 2026-06-15, 2026-07-15, full-time, Staff AI/ML Platform Engineer, Hyderabad. Architect GenAI LLM fine-tuning pipelines and Vertex AI vector search.
4, 2026-06-05, 2026-07-05, contract, Full Stack Cloud Architect, Bengaluru. Serverless Google Cloud Run microservices with React.
5, 2026-06-18, 2026-07-18, full-time, DevOps & Site Reliability Engineer, Pune. Terraform IaC, Kubernetes, and Prometheus observability.`;

const SAMPLE_DRAFTS_CSV = `id, jobId, type, contents, status
1, 1, cover_letter, "Dear Hiring Manager - I'm applying for the Senior Backend Engineer position at TechCorp. With over 6 years scaling Python microservices...", draft
2, 1, follow_up_email, "Following up on my application from June 12 for the Senior Backend Engineer role. I wanted to reiterate my enthusiasm...", sent
3, 2, cover_letter, "Dear Hiring Team at Nexus Stream Data, I am writing to express my strong interest in the Data Platform Engineer contract role...", reviewed
4, 2, follow_up_email, "Dear Nexus Stream Data Recruiting Team, I hope this week is going well. Following our initial submission, here is a project update...", draft`;

export const IngestionWizard: React.FC<IngestionWizardProps> = ({ onIngestionComplete, showToast }) => {
  const [activeTab, setActiveTab] = useState<'postings' | 'drafts'>('postings');
  const [postingsCsv, setPostingsCsv] = useState(SAMPLE_POSTINGS_CSV);
  const [draftsCsv, setDraftsCsv] = useState(SAMPLE_DRAFTS_CSV);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleIngestPostings = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setResult(null);
      const data = await api.jobs.ingestCsv(postingsCsv);
      setResult({
        type: 'postings',
        count: data.count,
        durationMs: data.durationMs,
        items: data.postings,
      });
      onIngestionComplete();
      if (showToast) showToast(`Successfully ingested ${data.count} job postings!`, 'success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIngestDrafts = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setResult(null);
      const data = await api.jobs.ingestDraftsCsv(draftsCsv);
      setResult({
        type: 'drafts',
        count: data.count,
        durationMs: data.durationMs,
        items: data.drafts,
      });
      onIngestionComplete();
      if (showToast) showToast(`Successfully ingested ${data.count} drafts!`, 'success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (activeTab === 'postings') {
        setPostingsCsv(content);
      } else {
        setDraftsCsv(content);
      }
      if (showToast) showToast(`Loaded file: ${file.name}`, 'info');
    };
    reader.readAsText(file);
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(activeTab === 'postings' ? SAMPLE_POSTINGS_CSV : SAMPLE_DRAFTS_CSV);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preview parsing of rows
  const currentCsv = activeTab === 'postings' ? postingsCsv : draftsCsv;
  const lines = currentCsv.trim().split('\n').filter(Boolean);
  const headers = lines[0]?.split(',').map((h) => h.trim()) || [];
  const previewRows = lines.slice(1, 5).map((line) => line.split(',').map((c) => c.trim()));

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Structured Dataset Ingestion Engine</h2>
              <span className="px-2 py-0.5 text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full font-medium">
                Evaluation Validator
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ingests evaluation datasets matching official challenge schemas at scale. Extracts parameters, links drafts to postings, and initializes state pipelines.
            </p>
          </div>

          {/* Quick Tabs */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => { setActiveTab('postings'); setResult(null); setError(null); }}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'postings'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Job Postings Schema
            </button>
            <button
              onClick={() => { setActiveTab('drafts'); setResult(null); setError(null); }}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'drafts'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Drafts & Emails Schema
            </button>
          </div>
        </div>
      </div>

      {/* Target Schema Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className={`p-3.5 rounded-xl border ${activeTab === 'postings' ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
          <div className="font-bold mb-1 flex items-center justify-between">
            <span>Target Postings Schema:</span>
            <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">5 Columns</span>
          </div>
          <code className="text-[11px] block bg-slate-900/90 p-2 rounded border border-slate-800 text-indigo-200">
            &lt;id&gt;, &lt;from&gt;, &lt;to&gt;, &lt;type&gt;, &lt;description&gt;
          </code>
        </div>
        <div className={`p-3.5 rounded-xl border ${activeTab === 'drafts' ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
          <div className="font-bold mb-1 flex items-center justify-between">
            <span>Target Drafts Schema:</span>
            <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">5 Columns</span>
          </div>
          <code className="text-[11px] block bg-slate-900/90 p-2 rounded border border-slate-800 text-indigo-200">
            &lt;id&gt;, &lt;jobId&gt;, &lt;type&gt;, &lt;contents&gt;, &lt;status&gt;
          </code>
        </div>
      </div>

      {/* CSV Input & Ingest Section */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>
              {activeTab === 'postings' ? 'Job Postings CSV / Raw Input' : 'Drafts & Emails CSV / Raw Input'}
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySample}
              className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Sample Copied' : 'Copy Sample CSV'}</span>
            </button>

            <label className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 cursor-pointer transition">
              <span>Upload CSV File</span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <textarea
          value={activeTab === 'postings' ? postingsCsv : draftsCsv}
          onChange={(e) =>
            activeTab === 'postings' ? setPostingsCsv(e.target.value) : setDraftsCsv(e.target.value)
          }
          rows={9}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed shadow-inner"
          placeholder="Paste CSV content here..."
        />

        {/* Live Structure Preview Table */}
        {headers.length > 0 && previewRows.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <Table className="w-3.5 h-3.5 text-indigo-400" />
              <span>Parsed Ingestion Preview ({lines.length - 1} records detected):</span>
            </div>
            <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-indigo-300">
                    {headers.map((h, i) => (
                      <th key={i} className="p-2 border-r border-slate-800/80 last:border-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-900 hover:bg-slate-900/40 font-mono text-[10px] text-slate-300">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-r border-slate-900 last:border-0 max-w-xs truncate">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Supports batch streaming ingestion, automated parameter extraction & historical linking.
          </span>

          <button
            onClick={activeTab === 'postings' ? handleIngestPostings : handleIngestDrafts}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing & Ingesting...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>
                  Execute Batch Ingestion ({activeTab === 'postings' ? 'Postings' : 'Drafts'})
                </span>
              </>
            )}
          </button>
        </div>

        {/* Status / Error feedback */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Ingestion Error: {error}</span>
          </div>
        )}

        {result && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Successfully ingested {result.count} {result.type} in {result.durationMs}ms!
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Entities have been indexed in PostgreSQL, linked to applicant pipeline stages, and synced with the AI historical memory bank.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
