"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Clock, TrendingDown, Trash2, ArrowRight } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

export default function TechnicalDebt() {
  const [activeRepoId, setActiveRepoId] = useState(null);
  const [activeRepoName, setActiveRepoName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debtData, setDebtData] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const repoId = localStorage.getItem("active_repo_id") || "all";
      const repoName = localStorage.getItem("active_repo_name") || "All Repositories";
      setActiveRepoId(repoId);
      setActiveRepoName(repoName);
      fetchDebtData(repoId);
    }
  }, []);

  const fetchDebtData = async (repoId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth(`/analytics/${repoId}/technical-debt`);
      setDebtData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch technical debt metrics.");
    } finally {
      setLoading(false);
    }
  };

  if (!activeRepoId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-lg bg-card text-center p-6 space-y-4 font-geist">
        <ShieldAlert className="h-10 w-10 text-secondary-text animate-pulse" />
        <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">No Active Repository Selected</h3>
        <p className="text-xs text-secondary-text max-w-sm leading-relaxed">
          Select an onboarded repository to scan for codebase TODO/FIXME markers, long methods, and duplication metrics.
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
        Running Technical Debt Scans...
      </div>
    );
  }

  const score = debtData ? debtData.score : 100.0;
  const estimatedHours = debtData ? debtData.estimated_cleanup_hours : 0.0;
  const todos = debtData ? debtData.todos : [];
  const longMethods = debtData ? debtData.long_methods_count : 0;
  const duplicateCode = debtData ? debtData.duplicate_code_pct : 0.0;
  const trend = debtData ? debtData.debt_trend : 0.0;

  return (
    <div className="space-y-8 font-geist">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-secondary-text uppercase font-semibold">Active Context: {activeRepoName}</span>
          <h2 className="text-xl font-bold text-primary-text">Technical Debt Engine</h2>
          <p className="text-xs text-secondary-text">Static scan patterns and debt impact metrics estimator</p>
        </div>
        <div className="px-4 py-2 bg-card border border-border rounded-lg flex items-center gap-3">
          <Clock className="h-5 w-5 text-info" />
          <div>
            <div className="text-xs text-secondary-text uppercase">Cleanup Effort</div>
            <div className="text-lg font-black text-primary-text">{estimatedHours.toFixed(1)} Hours</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-card border border-border p-6">
          <h3 className="text-xs font-semibold text-secondary-text uppercase mb-2">Debt Cleanliness</h3>
          <div className="text-2xl font-black text-success">{score.toFixed(1)} / 100</div>
          <span className="text-[10px] text-success font-semibold flex items-center mt-1">
            <TrendingDown className={`h-3 w-3 mr-1 ${trend > 0 ? "rotate-180 text-danger" : "text-success"}`} /> 
            {trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`} last week
          </span>
        </div>
        <div className="rounded-lg bg-card border border-border p-6">
          <h3 className="text-xs font-semibold text-secondary-text uppercase mb-2">Total Code Markers</h3>
          <div className="text-2xl font-black text-primary-text">{todos.length} items</div>
          <p className="text-[10px] text-secondary-text mt-1">TODO, FIXME, HACK tags in codebase</p>
        </div>
        <div className="rounded-lg bg-card border border-border p-6">
          <h3 className="text-xs font-semibold text-secondary-text uppercase mb-2">Long Files count</h3>
          <div className="text-2xl font-black text-warning">{longMethods} files</div>
          <p className="text-[10px] text-secondary-text mt-1">Code files exceeding 500 lines</p>
        </div>
        <div className="rounded-lg bg-card border border-border p-6">
          <h3 className="text-xs font-semibold text-secondary-text uppercase mb-2">Duplicate Code Ratio</h3>
          <div className="text-2xl font-black text-info">{duplicateCode.toFixed(1)} %</div>
          <p className="text-[10px] text-secondary-text mt-1">Identified duplicate code patterns</p>
        </div>
      </div>

      {/* Code Markers List Table */}
      <div className="rounded-lg bg-card border border-border p-6">
        <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase mb-4 flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-info" /> Code Quality Markers
        </h3>
        {todos.length === 0 ? (
          <div className="text-xs text-secondary-text text-center py-8 border border-dashed border-border rounded">
            No technical debt markers (TODO, FIXME, HACK) found in this codebase.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Type</th>
                  <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Location</th>
                  <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Comment Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {todos.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        item.type === 'TODO' ? 'bg-info/20 text-info' : item.type === 'FIXME' ? 'bg-danger/20 text-danger' : item.type === 'HACK' ? 'bg-warning/20 text-warning' : 'bg-primary-text/25 text-primary-text'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-secondary-text font-mono text-[11px]">{item.file}:{item.line}</td>
                    <td className="px-3 py-4 text-primary-text max-w-sm truncate" title={item.text}>{item.text}</td>
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
