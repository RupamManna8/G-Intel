"use client";

import { FolderGit, ShieldAlert, Binary, Cpu } from 'lucide-react';

export default function Home() {
  const handleLogin = () => {
    // Redirect to the FastAPI OAuth login endpoint
    window.location.href = "http://localhost:8000/api/v1/auth/login";
  };

  const capabilities = [
    { title: "Repository Intelligence", desc: "Automated commit, issue, and release telemetry logs.", icon: FolderGit },
    { title: "AST Architecture Audit", desc: "Maps circular imports, layer violations, and God classes.", icon: Binary },
    { title: "Technical Debt Forecast", desc: "Scans TODOs, HACKs, code duplications, and estimates cleaning hours.", icon: ShieldAlert },
    { title: "Commit & PR Automation", desc: "Level 1-4 autonomous maintenance and risk predictions.", icon: Cpu }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background px-6 py-12 font-geist">
      <div className="w-full max-w-4xl space-y-12 text-center">
        {/* Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-info/10 border border-info/30 text-xs text-info font-semibold uppercase tracking-wider">
            Enterprise Grade AI Manager
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-primary-text">
            GitHub Engineering Intelligence Platform
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-secondary-text">
            Continuous AST boundary validation, PR failure prediction patterns, developer productivity streaks, and autonomous maintenance engines.
          </p>
        </div>

        {/* Action button */}
        <div>
          <button
            onClick={handleLogin}
            className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-sm font-bold rounded bg-info text-primary-text hover:bg-info/90 transition-colors shadow"
          >
            Authenticate with GitHub OAuth
          </button>
          <div className="text-[10px] text-secondary-text mt-2">
            Requires authorization to read repository structures and install webhook listener hooks.
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-3xl mx-auto text-left mt-8">
          {capabilities.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="p-5 rounded bg-card border border-border space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-secondary-bg flex items-center justify-center text-info">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">{c.title}</h3>
                </div>
                <p className="text-xs text-secondary-text leading-relaxed">
                  {c.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
