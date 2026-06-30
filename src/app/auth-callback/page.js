"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, GitBranch, Activity, Check, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [statusText, setStatusText] = useState("Initializing secure authentication session...");
  const [onboardedCount, setOnboardedCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let token = searchParams.get("token");
    let username = searchParams.get("username");

    // Fall back to localStorage if layout.js has already intercepted and cleared them
    if (!token) {
      token = localStorage.getItem("auth_token");
    }
    if (!username) {
      username = localStorage.getItem("auth_username");
    }

    if (!token || !username) {
      setError("Authentication parameters missing. Please try logging in again.");
      return;
    }

    // 1. Save credentials to local storage (in case they weren't saved by layout.js)
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_username", username);
    window.dispatchEvent(new Event("storage"));

    // Begin the initialization workflow
    initializeProfile();
  }, [searchParams]);

  const initializeProfile = async () => {
    try {
      setCurrentStep(1);
      setStatusText("Acquiring token clearance and registering user environment...");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Smooth UX transition

      // 2. Query repositories auto-onboarding from GitHub
      setCurrentStep(2);
      setStatusText("Discovering repositories and claiming access configurations...");
      
      const initResponse = await fetchWithAuth("/auth/initialize-profile", {
        method: "POST"
      });

      const repos = initResponse.repositories || [];
      setOnboardedCount(repos.length);

      if (repos.length === 0) {
        // User has no repositories. Skip scanning and redirect
        setCurrentStep(3);
        setStatusText("No repositories detected. Directing to setup workspace...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        setCurrentStep(4);
        router.push("/repositories");
        return;
      }

      // 3. Deep code AST scanning
      setCurrentStep(3);
      setStatusText(`Scanning codebases for ${repos.length} repositories...`);

      // Poll repositories status until at least one is ready
      let isReady = false;
      const startTime = Date.now();
      const timeoutLimit = 15000; // 15 seconds maximum wait

      while (!isReady && (Date.now() - startTime) < timeoutLimit) {
        try {
          const checkRepos = await fetchWithAuth("/repositories");
          const completedRepo = checkRepos.find(r => r.onboarding_status === "COMPLETED");
          
          if (completedRepo) {
            isReady = true;
            // Set the first completed repository as active
            localStorage.setItem("active_repo_id", completedRepo.id);
            localStorage.setItem("active_repo_name", completedRepo.full_name);
            window.dispatchEvent(new Event("storage"));
            break;
          }
        } catch (e) {
          console.warn("Retrying repository status check...", e);
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2s
      }

      // If timeout reached and none are completed, set the first scanning one as active
      if (!isReady) {
        const checkRepos = await fetchWithAuth("/repositories");
        if (checkRepos.length > 0) {
          localStorage.setItem("active_repo_id", checkRepos[0].id);
          localStorage.setItem("active_repo_name", checkRepos[0].full_name);
          window.dispatchEvent(new Event("storage"));
        }
      }

      // 4. Redirecting
      setCurrentStep(4);
      setStatusText("Compiling dashboard telemetry and indexing graph dependencies...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      setError("Failed to onboard GitHub repositories during profile initialization.");
    }
  };

  const steps = [
    { id: 1, label: "Authorize Identity", desc: "OAuth token handshake", icon: ShieldAlert },
    { id: 2, label: "Acquire Access", desc: "Discover code repositories", icon: GitBranch },
    { id: 3, label: "Analyze Codebase", desc: "Map AST structure & debt", icon: Activity },
    { id: 4, label: "Ready", desc: "Redirecting to workspace", icon: Sparkles }
  ];

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#0A0E14] text-primary-text font-geist px-6 text-center">
        <div className="max-w-md p-6 bg-[#161B22] border border-danger/30 rounded-lg space-y-4">
          <AlertCircle className="h-12 w-12 text-danger mx-auto" />
          <h3 className="text-base font-bold uppercase tracking-wide">Analysis Interrupted</h3>
          <p className="text-xs text-secondary-text leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.href = "/"}
            className="w-full py-2 bg-info hover:bg-info/90 text-primary-text text-xs font-bold rounded transition-colors"
          >
            Return to Authentication Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0A0E14] text-primary-text font-geist p-6">
      <div className="w-full max-w-xl space-y-12">
        {/* Header Loader */}
        <div className="text-center space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border border-border border-t-info animate-spin"></div>
            <Activity className="absolute h-6 w-6 text-info animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight uppercase">Analyzing Engineer Profile</h2>
            <p className="text-xs text-secondary-text max-w-sm mx-auto leading-relaxed h-8">
              {statusText}
            </p>
          </div>
        </div>

        {/* Steps Visualizer */}
        <div className="bg-[#161B22] border border-[#2D3748] rounded-lg p-6 space-y-4 divide-y divide-[#2D3748]/50">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.id;
            const isActive = currentStep === s.id;
            const isPending = currentStep < s.id;

            return (
              <div 
                key={s.id} 
                className={`flex items-center gap-4 py-3 transition-opacity duration-300 ${
                  isPending ? "opacity-35" : "opacity-100"
                }`}
              >
                <div className={`h-8 w-8 rounded flex items-center justify-center flex-shrink-0 ${
                  isCompleted 
                    ? "bg-success/20 text-success border border-success/30" 
                    : isActive 
                      ? "bg-info/20 text-info border border-info animate-pulse" 
                      : "bg-[#111827] text-secondary-text border border-border"
                }`}>
                  {isCompleted ? (
                    <Check className="h-4.5 w-4.5" />
                  ) : isActive && s.id !== 4 ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Icon className="h-4.5 w-4.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${
                      isActive ? "text-info" : isCompleted ? "text-success" : "text-secondary-text"
                    }`}>
                      {s.label}
                    </h4>
                    {isActive && s.id === 3 && onboardedCount > 0 && (
                      <span className="text-[9px] font-mono text-secondary-text font-bold px-1.5 py-0.2 rounded bg-secondary-bg border border-border">
                        {onboardedCount} repos detected
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-secondary-text truncate mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer telemetry notice */}
        <div className="text-[10px] text-center text-secondary-text uppercase tracking-wider leading-relaxed">
          Platform version 1.0.0 • Secure connection • Continuous AST auditing active
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#0A0E14] font-geist">
        <Loader2 className="h-8 w-8 text-[#3B82F6] animate-spin" />
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}
