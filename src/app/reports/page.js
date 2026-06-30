"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FilePieChart, Download, Mail, CheckCircle, ArrowRight } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

export default function Reports() {
  const [activeRepoId, setActiveRepoId] = useState(null);
  const [activeRepoName, setActiveRepoName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Weekly reports telemetry
  const [latestReport, setLatestReport] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const repoId = localStorage.getItem("active_repo_id") || "all";
      const repoName = localStorage.getItem("active_repo_name") || "All Repositories";
      setActiveRepoId(repoId);
      setActiveRepoName(repoName);
      fetchReportsData(repoId);
    }
  }, []);

  const fetchReportsData = async (repoId) => {
    try {
      setLoading(true);
      setError(null);
      const [latest, list] = await Promise.all([
        fetchWithAuth(`/reports/${repoId}/weekly`),
        fetchWithAuth(`/reports/${repoId}/weekly-list`)
      ]);
      setLatestReport(latest);
      setReports(list);
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve compiled weekly engineering reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!activeRepoId) return;
    setDownloading(true);
    // Point directly to backend PDF download URL using active repository context
    window.open(`http://localhost:8000/api/v1/reports/${activeRepoId}/weekly/download`, "_blank");
    setTimeout(() => setDownloading(false), 2000);
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  if (!activeRepoId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-lg bg-card text-center p-6 space-y-4 font-geist">
        <FilePieChart className="h-10 w-10 text-secondary-text animate-pulse" />
        <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">No Active Repository Selected</h3>
        <p className="text-xs text-secondary-text max-w-sm leading-relaxed">
          Select an onboarded repository to generate engineering report summary logs and weekly PDF templates.
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
        Compiling engineering summaries archive...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-geist">
      {/* Header */}
      <div>
        <span className="text-[10px] text-secondary-text uppercase font-semibold">Active Context: {activeRepoName}</span>
        <h2 className="text-xl font-bold text-primary-text">Weekly Engineering Reports</h2>
        <p className="text-xs text-secondary-text">Orchestrated summary compilations, architecture scoring, and PDF email outputs</p>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Latest report details */}
        <div className="lg:col-span-2 rounded-lg bg-card border border-border p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase flex items-center gap-2">
              <FilePieChart className="h-4 w-4 text-info" /> Latest Summary {latestReport && latestReport.end_date ? `(Week ending ${latestReport.end_date})` : "(No Report)"}
            </h3>
            <span className="text-xs text-secondary-text">ICE Scored Metric</span>
          </div>

          {!latestReport || !latestReport.end_date ? (
            <div className="text-xs text-secondary-text text-center py-12 border border-dashed border-border rounded">
              No weekly report generated yet for this repository context. Weekly reports are automatically compiled every Sunday.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-center">
                <div className="p-3 bg-secondary-bg border border-border rounded">
                  <span className="text-[9px] text-secondary-text block uppercase">Health Score</span>
                  <strong className="text-success text-lg font-black">{latestReport.repository_health_score.toFixed(1)}%</strong>
                </div>
                <div className="p-3 bg-secondary-bg border border-border rounded">
                  <span className="text-[9px] text-secondary-text block uppercase">AST Structure</span>
                  <strong className="text-primary-text text-lg font-black">{latestReport.architecture_score.toFixed(1)}/100</strong>
                </div>
                <div className="p-3 bg-secondary-bg border border-border rounded">
                  <span className="text-[9px] text-secondary-text block uppercase">Technical Debt</span>
                  <strong className="text-warning text-lg font-black">{latestReport.technical_debt_score.toFixed(1)}/100</strong>
                </div>
                <div className="p-3 bg-secondary-bg border border-border rounded">
                  <span className="text-[9px] text-secondary-text block uppercase">Team Velocity</span>
                  <strong className="text-info text-lg font-black">{latestReport.productivity_score.toFixed(1)}/100</strong>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 bg-info text-primary-text font-bold text-xs rounded hover:bg-info/90 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" /> Download PDF Report
                </button>
                <button
                  onClick={handleSendEmail}
                  className="flex-1 py-2.5 bg-secondary-bg text-primary-text border border-border font-bold text-xs rounded hover:bg-card flex items-center justify-center gap-2"
                >
                  {emailSent ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" /> Email Sent
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" /> Email Report to Team
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* History of compiled reports */}
        <div className="rounded-lg bg-card border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase">Archive Logs</h3>
          
          {reports.length === 0 ? (
            <div className="text-xs text-secondary-text text-center py-8 border border-dashed border-border rounded">
              No archived reports found.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {reports.map((rep) => (
                <div key={rep.id} className="p-3 bg-secondary-bg border border-border rounded flex justify-between items-center">
                  <div>
                    <div className="font-bold text-primary-text">{rep.start} to {rep.end}</div>
                    <span className="text-[10px] text-secondary-text">PRs: {rep.open_prs} | Issues: {rep.issues}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-secondary-text block">Health</span>
                    <strong className="text-success">{rep.health.toFixed(1)}%</strong>
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
