"use client";

import { Cpu, Play, CheckCircle, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '../../lib/api';

export default function Automation() {
  const [activeRepoId, setActiveRepoId] = useState(null);
  const [activeRepoName, setActiveRepoName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [runningJobType, setRunningJobType] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const repoId = localStorage.getItem("active_repo_id") || "all";
      const repoName = localStorage.getItem("active_repo_name") || "All Repositories";
      setActiveRepoId(repoId);
      setActiveRepoName(repoName);
      fetchJobs(repoId);
    }
  }, []);

  const fetchJobs = async (repoId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth(`/analytics/${repoId}/automation-jobs`);
      setJobs(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch autonomous jobs history.");
    } finally {
      setLoading(false);
    }
  };

  const triggerJob = async (type) => {
    if (!activeRepoId) return;
    try {
      setRunningJobType(type);
      setError(null);
      const newJob = await fetchWithAuth(`/analytics/${activeRepoId}/automation-jobs`, {
        method: "POST",
        body: JSON.stringify({ type: type, target_branch: "main" })
      });
      setJobs(curr => [newJob, ...curr]);
      
      // Poll/refresh after 6 seconds to see if it transitions to completed (mock behaviour transitions in 5s)
      setTimeout(() => fetchJobs(activeRepoId), 6000);
    } catch (err) {
      console.error(err);
      setError("Failed to trigger autonomous maintenance job.");
    } finally {
      setRunningJobType(null);
    }
  };

  if (!activeRepoId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-lg bg-card text-center p-6 space-y-4 font-geist">
        <Cpu className="h-10 w-10 text-secondary-text animate-pulse" />
        <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">No Active Repository Selected</h3>
        <p className="text-xs text-secondary-text max-w-sm leading-relaxed">
          Select an onboarded repository to control autonomous code correction sweeps and linters.
        </p>
        <Link 
          href="/repositories"
          className="inline-flex items-center gap-2 px-4 py-2 bg-info text-primary-text font-bold text-xs rounded hover:bg-info/90 transition-colors"
        >
          Select Repository <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center text-xs uppercase tracking-widest text-secondary-text font-geist animate-pulse">
        Connecting to Autonomous Maintenance Console...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-geist">
      {/* Header */}
      <div>
        <span className="text-[10px] text-secondary-text uppercase font-semibold">Active Context: {activeRepoName}</span>
        <h2 className="text-xl font-bold text-primary-text">Autonomous Maintenance Engine</h2>
        <p className="text-xs text-secondary-text">Level 1-4 automatic linters, formatting, and security patch generators</p>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Control console */}
      <div className="rounded-lg bg-card border border-border p-6 space-y-6">
        <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase flex items-center gap-2">
          <Cpu className="h-4 w-4 text-info" /> Trigger Maintenance Routines
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Lint & Format Fix", type: "LINT_FIX", desc: "Runs Black/Flake8 check corrections and auto formats import layouts." },
            { name: "Bump Dependencies", type: "DEPENDENCY_UPDATE", desc: "Scans requirements file for out-of-date security patches and submits updates." },
            { name: "Sync Codebase Docs", type: "DOCS_GENERATION", desc: "Auto compiles markdown references mapping directory components structures." }
          ].map((btn) => (
            <div key={btn.type} className="p-4 rounded border border-border bg-secondary-bg flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-primary-text text-sm">{btn.name}</h4>
                <p className="text-secondary-text text-[11px] leading-relaxed">{btn.desc}</p>
              </div>
              <button
                disabled={runningJobType !== null}
                onClick={() => triggerJob(btn.type)}
                className={`w-full py-2 bg-info text-primary-text font-bold text-xs rounded hover:bg-info/90 transition-colors flex items-center justify-center gap-2 ${
                  runningJobType !== null ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {runningJobType === btn.type ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Running
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" /> Trigger Job
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Jobs history */}
      <div className="rounded-lg bg-card border border-border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase">Automation Jobs Log</h3>
          <button 
            onClick={() => fetchJobs(activeRepoId)}
            className="p-1 text-secondary-text hover:text-primary-text transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        
        {jobs.length === 0 ? (
          <div className="text-xs text-secondary-text text-center py-8 border border-dashed border-border rounded">
            No automation jobs run yet for this repository context.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Job Task</th>
                  <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Branch</th>
                  <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Execution Status</th>
                  <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Trigger Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-geist">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-3 py-4">
                      <div>
                        <div className="font-bold text-primary-text">{job.type}</div>
                        <div className="text-[10px] text-secondary-text mt-0.5">{job.description}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-secondary-text font-mono font-bold">{job.target_branch}</td>
                    <td className="px-3 py-4">
                      {job.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success/20 text-success text-[10px] font-semibold">
                          <CheckCircle className="h-3 w-3" /> Completed
                        </span>
                      ) : job.status === "RUNNING" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-info/20 text-info text-[10px] font-semibold animate-pulse">
                          <RefreshCw className="h-3 w-3 animate-spin" /> In progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-danger/20 text-danger text-[10px] font-semibold">
                          <AlertTriangle className="h-3 w-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-secondary-text">
                      {job.created_at.includes("T") ? job.created_at.replace("T", " ").substring(0, 19) : job.created_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
