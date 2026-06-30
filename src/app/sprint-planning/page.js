"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, AlertTriangle, ArrowUpRight, Award, ArrowRight } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

export default function SprintPlanning() {
  const [activeRepoId, setActiveRepoId] = useState(null);
  const [activeRepoName, setActiveRepoName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const repoId = localStorage.getItem("active_repo_id") || "all";
      const repoName = localStorage.getItem("active_repo_name") || "All Repositories";
      setActiveRepoId(repoId);
      setActiveRepoName(repoName);
      fetchRecommendations(repoId);
    }
  }, []);

  const fetchRecommendations = async (repoId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth(`/analytics/${repoId}/sprint-recommendations`);
      setRecommendations(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch sprint recommendations from backend.");
    } finally {
      setLoading(false);
    }
  };

  if (!activeRepoId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-lg bg-card text-center p-6 space-y-4 font-geist">
        <CalendarDays className="h-10 w-10 text-secondary-text animate-pulse" />
        <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">No Active Repository Selected</h3>
        <p className="text-xs text-secondary-text max-w-sm leading-relaxed">
          Select an onboarded repository to generate backlog task priorities and ICE framework scores.
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
        Compiling sprint recommendations backlog...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-geist">
      {/* Header */}
      <div>
        <span className="text-[10px] text-secondary-text uppercase font-semibold">Active Context: {activeRepoName}</span>
        <h2 className="text-xl font-bold text-primary-text">Sprint Recommendation Engine</h2>
        <p className="text-xs text-secondary-text">AI task prioritizations and ICE/RICE scoring backlog advisor</p>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Recommendations logs */}
      <div className="rounded-lg bg-card border border-border p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-info" /> Recommended Sprint Backlog Tasks
          </h3>
          <span className="text-[10px] text-secondary-text uppercase">ICE Framework Active</span>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-xs text-secondary-text text-center py-12 border border-dashed border-border rounded">
            No recommendations generated yet. Initiate a supervisor workflow or wait for scans to complete.
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const effort = rec.effort || 5;
              const impact = rec.impact || 5;
              const confidence = rec.confidence || 0.8;
              const iceScore = ((impact * confidence * 10) / effort).toFixed(1);
              return (
                <div key={rec.id} className="p-4 rounded border border-border bg-secondary-bg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        rec.priority === 'HIGH' ? 'bg-danger/20 text-danger' : rec.priority === 'MEDIUM' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                      }`}>
                        {rec.priority}
                      </span>
                      <span className="text-secondary-text text-[10px] uppercase font-mono">{rec.type}</span>
                    </div>
                    <h4 className="font-bold text-primary-text text-sm">{rec.title}</h4>
                    <p className="text-secondary-text text-[11px] max-w-2xl">{rec.description}</p>
                  </div>
                  
                  {/* Scoring meters */}
                  <div className="flex gap-6 items-center border-l border-border pl-6">
                    <div className="text-center">
                      <span className="text-[9px] text-secondary-text block uppercase">Impact</span>
                      <strong className="text-primary-text text-xs">{impact}/10</strong>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-secondary-text block uppercase">Effort</span>
                      <strong className="text-primary-text text-xs">{effort}/10</strong>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-secondary-text block uppercase">Confidence</span>
                      <strong className="text-primary-text text-xs">{Math.round(confidence * 100)}%</strong>
                    </div>
                    <div className="text-center px-3 py-2 rounded bg-card border border-border">
                      <span className="text-[9px] text-secondary-text block uppercase">ICE Score</span>
                      <strong className="text-info text-sm font-black">{iceScore}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
