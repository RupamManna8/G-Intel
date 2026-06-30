"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Binary, ShieldAlert, ArrowRight } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

export default function Architecture() {
  const [activeRepoId, setActiveRepoId] = useState(null);
  const [activeRepoName, setActiveRepoName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [archData, setArchData] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const repoId = localStorage.getItem("active_repo_id") || "all";
      const repoName = localStorage.getItem("active_repo_name") || "All Repositories";
      setActiveRepoId(repoId);
      setActiveRepoName(repoName);
      fetchArchData(repoId);
    }
  }, []);

  const fetchArchData = async (repoId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth(`/analytics/${repoId}/architecture`);
      setArchData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch architecture metrics.");
    } finally {
      setLoading(false);
    }
  };

  if (!activeRepoId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-lg bg-card text-center p-6 space-y-4 font-geist">
        <Binary className="h-10 w-10 text-secondary-text animate-pulse" />
        <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">No Active Repository Selected</h3>
        <p className="text-xs text-secondary-text max-w-sm leading-relaxed">
          Select an onboarded repository to generate AST-based import maps, circle chains, and dependency violations.
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
        Building AST Dependency Model...
      </div>
    );
  }

  const score = archData ? archData.score : 100.0;
  const circles = archData ? archData.circular_dependencies : [];
  const violations = archData ? archData.layer_violations : [];
  const godClasses = archData ? archData.god_classes : [];

  return (
    <div className="space-y-8 font-geist">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-secondary-text uppercase font-semibold">Active Context: {activeRepoName}</span>
          <h2 className="text-xl font-bold text-primary-text">Architecture Analysis Engine</h2>
          <p className="text-xs text-secondary-text">AST-based static import validation and structural boundary checkers</p>
        </div>
        <div className="px-4 py-2 bg-card border border-border rounded-lg flex items-center gap-3">
          <Binary className="h-5 w-5 text-warning" />
          <div>
            <div className="text-xs text-secondary-text uppercase">Architecture Score</div>
            <div className="text-lg font-black text-primary-text">{score.toFixed(1)} / 100</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-card border border-border p-6">
          <h3 className="text-xs font-semibold text-secondary-text uppercase mb-2">Circular Dependencies</h3>
          <div className="text-2xl font-black text-danger">{circles.length}</div>
          <p className="text-[10px] text-secondary-text mt-1">Modules importing each other in cyclic paths</p>
        </div>
        <div className="rounded-lg bg-card border border-border p-6">
          <h3 className="text-xs font-semibold text-secondary-text uppercase mb-2">Layer Violations</h3>
          <div className="text-2xl font-black text-warning">{violations.length}</div>
          <p className="text-[10px] text-secondary-text mt-1">Import boundary restrictions infractions</p>
        </div>
        <div className="rounded-lg bg-card border border-border p-6">
          <h3 className="text-xs font-semibold text-secondary-text uppercase mb-2">God Classes / Large Modules</h3>
          <div className="text-2xl font-black text-info">{godClasses.length}</div>
          <p className="text-[10px] text-secondary-text mt-1">Classes exceeding 500 lines or 80 complexity</p>
        </div>
      </div>

      {/* Circular dependencies log */}
      <div className="rounded-lg bg-card border border-border p-6">
        <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-danger" /> Detected Import Cycles
        </h3>
        {circles.length === 0 ? (
          <div className="text-xs text-secondary-text text-center py-8 border border-dashed border-border rounded">
            No circular import loops detected in AST walk.
          </div>
        ) : (
          <div className="space-y-3">
            {circles.map((path, idx) => (
              <div key={idx} className="p-3 bg-secondary-bg border border-border rounded text-xs font-mono">
                <span className="text-danger font-semibold mr-2">Cycle #{idx + 1}:</span>
                {path.join(" ➔ ")}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Layer Violations and God Classes log */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg bg-card border border-border p-6">
          <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-warning" /> Boundary Violations
          </h3>
          {violations.length === 0 ? (
            <div className="text-xs text-secondary-text text-center py-8 border border-dashed border-border rounded">
              No layered architectural boundary violations found.
            </div>
          ) : (
            <div className="space-y-3">
              {violations.map((v, idx) => (
                <div key={idx} className="p-3 bg-secondary-bg border border-border rounded text-xs">
                  <div className="font-semibold text-primary-text mb-1">{v.file}</div>
                  <p className="text-secondary-text leading-relaxed">{v.violation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-card border border-border p-6">
          <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase mb-4">
            Large / Complex Classes (God classes)
          </h3>
          {godClasses.length === 0 ? (
            <div className="text-xs text-secondary-text text-center py-8 border border-dashed border-border rounded">
              No massive or complex God classes detected.
            </div>
          ) : (
            <div className="space-y-3">
              {godClasses.map((gc, idx) => (
                <div key={idx} className="p-3 bg-secondary-bg border border-border rounded text-xs flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-primary-text">{gc.name}</div>
                    <span className="font-mono text-[10px] text-secondary-text">{gc.file}</span>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-secondary-text uppercase block">Lines</span>
                      <strong className="text-primary-text">{gc.lines}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary-text uppercase block">Complexity</span>
                      <strong className="text-warning">{gc.complexity}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
