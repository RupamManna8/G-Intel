"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Award, ShieldAlert, TrendingUp, ArrowRight } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

export default function Developers() {
  const [activeRepoId, setActiveRepoId] = useState(null);
  const [activeRepoName, setActiveRepoName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [developers, setDevelopers] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const repoId = localStorage.getItem("active_repo_id") || "all";
      const repoName = localStorage.getItem("active_repo_name") || "All Repositories";
      setActiveRepoId(repoId);
      setActiveRepoName(repoName);
      fetchDevelopersData(repoId);
    }
  }, []);

  const fetchDevelopersData = async (repoId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth(`/analytics/${repoId}/productivity`);
      setDevelopers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch developer productivity analytics.");
    } finally {
      setLoading(false);
    }
  };

  if (!activeRepoId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-lg bg-card text-center p-6 space-y-4 font-geist">
        <Users className="h-10 w-10 text-secondary-text animate-pulse" />
        <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">No Active Repository Selected</h3>
        <p className="text-xs text-secondary-text max-w-sm leading-relaxed">
          Select an onboarded repository to compute commit frequency, streaks, and generate coaching recommendations.
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
        Aggregating Team Productivity Scores...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-geist">
      {/* Header */}
      <div>
        <span className="text-[10px] text-secondary-text uppercase font-semibold">Active Context: {activeRepoName}</span>
        <h2 className="text-xl font-bold text-primary-text">Developer Productivity Coach</h2>
        <p className="text-xs text-secondary-text">Developer commitment velocity, streaks, and custom engineering insights</p>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Contributor List Grid */}
      {developers.length === 0 ? (
        <div className="text-xs text-secondary-text text-center py-8 border border-dashed border-border rounded">
          No contributors or commit records found for this repository context.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {developers.map((dev) => (
            <div key={dev.contributor_id} className="rounded-lg bg-card border border-border p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary-bg border border-border flex items-center justify-center font-bold text-sm text-info">
                    {dev.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-text">{dev.username}</h4>
                    <span className="text-[10px] text-secondary-text block">Contributor</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-black ${
                  dev.productivity_score > 85 ? 'bg-success/20 text-success' : dev.productivity_score > 70 ? 'bg-info/20 text-info' : 'bg-warning/20 text-warning'
                }`}>
                  {dev.productivity_score.toFixed(1)} Score
                </span>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-border text-center text-xs">
                <div>
                  <span className="text-[10px] text-secondary-text block uppercase">Commits</span>
                  <strong className="text-primary-text">{dev.commits_count}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-secondary-text block uppercase">PRs</span>
                  <strong className="text-primary-text">{dev.prs_opened}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-secondary-text block uppercase">Streak</span>
                  <strong className="text-primary-text">{dev.streak} days</strong>
                </div>
              </div>

              {/* Insights logs */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-semibold text-secondary-text uppercase tracking-wider block">Coaching Logs</span>
                <ul className="space-y-1.5">
                  {dev.insights.map((insight, idx) => (
                    <li key={idx} className="p-2 rounded bg-secondary-bg border border-border text-secondary-text leading-relaxed">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
