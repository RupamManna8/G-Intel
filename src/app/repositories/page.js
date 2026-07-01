"use client";

import { useState, useEffect } from 'react';
import { FolderGit, CheckCircle, RefreshCw, AlertTriangle, Plus, Check, Github, Clock } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

export default function Repositories() {
  const [repos, setRepos] = useState([]);
  const [githubRepos, setGithubRepos] = useState([]);
  const [inputName, setInputName] = useState("");
  const [loading, setLoading] = useState(true);
  const [githubLoading, setGithubLoading] = useState(false);
  const [activeRepoId, setActiveRepoId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadOnboardedRepos = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth("/repositories");
      setRepos(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch onboarded repositories.");
    } finally {
      setLoading(false);
    }
  };

  const loadGithubRepos = async () => {
    try {
      setGithubLoading(true);
      const data = await fetchWithAuth("/repositories/github");
      setGithubRepos(data);
    } catch (err) {
      console.error(err);
      // Let it degrade gracefully if App configurations are still mocked
    } finally {
      setGithubLoading(false);
    }
  };

  useEffect(() => {
    loadOnboardedRepos();
    loadGithubRepos();
    if (typeof window !== "undefined") {
      setActiveRepoId(localStorage.getItem("active_repo_id"));
    }
  }, []);

  const handleOnboard = async (repoName, installationId = null) => {
    if (!repoName.trim()) return;

    try {
      setError(null);
      setSuccessMsg(null);
      const newRepo = await fetchWithAuth("/repositories/onboard", {
        method: "POST",
        body: JSON.stringify({ 
          full_name: repoName.trim(),
          installation_id: installationId
        })
      });
      
      setRepos(prev => {
        const exists = prev.some(r => r.full_name === newRepo.full_name);
        if (exists) return prev.map(r => r.full_name === newRepo.full_name ? newRepo : r);
        return [...prev, newRepo];
      });
      
      setSuccessMsg(`Successfully queued onboarding scan for ${repoName}.`);
      setInputName("");
      
      if (!activeRepoId) {
        selectRepository(newRepo.id, newRepo.full_name);
      }
      
      setTimeout(() => setSuccessMsg(null), 4000);
      setTimeout(loadOnboardedRepos, 3000);
    } catch (err) {
      console.error(err);
      setError(`Failed to onboard ${repoName}. Verify that your GitHub App has access to this repository.`);
    }
  };

  const selectRepository = (id, fullName) => {
    localStorage.setItem("active_repo_id", id);
    localStorage.setItem("active_repo_name", fullName);
    setActiveRepoId(id);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="space-y-8 font-geist">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-primary-text">Repositories Engine</h2>
        <p className="text-xs text-secondary-text">Onboard, sync, and monitor code base scanning states</p>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-success/10 border border-success/30 text-success rounded-lg text-xs">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Onboarded Repositories */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg bg-card border border-border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase">Onboarded Repositories</h3>
              <button 
                onClick={loadOnboardedRepos}
                className="p-1 text-secondary-text hover:text-primary-text transition-colors"
                title="Refresh status"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            
            {loading ? (
              <div className="text-xs text-secondary-text text-center py-8">Loading onboarded repositories...</div>
            ) : repos.length === 0 ? (
              <div className="text-xs text-secondary-text text-center py-8 border border-dashed border-border rounded px-4 leading-relaxed">
                No repositories onboarded yet. Select one from your GitHub list on the right or enter a manual path below.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Repository</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Default Branch</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Status</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {repos.map((repo) => {
                      const isActive = activeRepoId === repo.id;
                      return (
                        <tr key={repo.id} className={isActive ? "bg-info/5" : ""}>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              <FolderGit className="h-5 w-5 text-info flex-shrink-0" />
                              <div>
                                <div className="font-bold text-primary-text flex items-center gap-2">
                                  {repo.full_name}
                                  {isActive && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-info/20 text-info text-[9px] font-bold uppercase">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-secondary-text">
                                  {repo.description || (repo.onboarding_status === "COMPLETED" ? "Onboarding scan complete." : "Scanning repository structure...")}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-secondary-text font-mono">{repo.default_branch}</td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            {repo.onboarding_status === "COMPLETED" ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-success/20 text-success font-semibold text-[10px]">
                                <CheckCircle className="h-3 w-3" /> Ready
                              </span>
                            ) : repo.onboarding_status === "SCANNING" ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-info/20 text-info font-semibold text-[10px] animate-pulse">
                                <RefreshCw className="h-3 w-3 animate-spin" /> Scanning
                              </span>
                            ) : repo.onboarding_status === "PENDING" ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-warning/20 text-warning font-semibold text-[10px]">
                                <Clock className="h-3 w-3" /> Queued
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-danger/20 text-danger font-semibold text-[10px]">
                                <AlertTriangle className="h-3 w-3" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isActive ? (
                                <button
                                  disabled
                                  className="px-2.5 py-1 bg-secondary-bg text-secondary-text border border-border font-bold text-[10px] rounded cursor-not-allowed flex items-center gap-1"
                                >
                                  <Check className="h-3 w-3" /> Selected
                                </button>
                              ) : (
                                <button
                                  onClick={() => selectRepository(repo.id, repo.full_name)}
                                  className="px-2.5 py-1 bg-info text-primary-text font-bold text-[10px] rounded hover:bg-info/90"
                                >
                                  Select Active
                                </button>
                              )}
                              <button
                                onClick={() => handleOnboard(repo.full_name, repo.installation_id)}
                                className="px-2.5 py-1 bg-secondary-bg text-primary-text border border-border font-bold text-[10px] rounded hover:bg-card flex items-center gap-1.5 transition-colors"
                                title="Re-run scanning engine"
                              >
                                <RefreshCw className="h-3 w-3" /> Sync
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Manual Onboard Input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleOnboard(inputName); }} 
            className="p-6 bg-card border border-border rounded-lg space-y-4"
          >
            <h3 className="text-xs font-semibold text-secondary-text uppercase tracking-wider">Manual Onboard (By Name)</h3>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="e.g. facebook/react"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="flex-1 bg-secondary-bg border border-border rounded px-3 py-2 text-xs text-primary-text focus:outline-none focus:border-info"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-info text-primary-text font-bold text-xs rounded hover:bg-info/90 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Path
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Available GitHub Repositories */}
        <div className="rounded-lg bg-card border border-border p-6 flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase flex items-center gap-2">
              <Github className="h-4 w-4 text-info" /> GitHub App Repositories
            </h3>
            <button 
              onClick={loadGithubRepos}
              className="p-1 text-secondary-text hover:text-primary-text transition-colors"
              title="Reload repository list"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          
          <div className="text-[10px] text-secondary-text mb-4 flex-shrink-0">
            These repositories are accessible by your GitHub App installation. Click <strong>Onboard</strong> to start scanning them.
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {githubLoading ? (
              <div className="text-xs text-secondary-text text-center py-8 animate-pulse">
                Fetching accessible repositories...
              </div>
            ) : githubRepos.length === 0 ? (
              <div className="text-xs text-secondary-text text-center py-8 border border-dashed border-border rounded px-4 leading-relaxed">
                No accessible repositories found. Ensure your GitHub App is installed on your account or organization and has repository access enabled.
              </div>
            ) : (
              githubRepos.map((repo) => {
                const isOnboarded = repos.some(r => r.full_name === repo.full_name);
                return (
                  <div key={repo.id} className="p-3 bg-secondary-bg border border-border rounded flex justify-between items-center text-xs font-geist">
                    <div className="min-w-0 flex-1 pr-3">
                      <h4 className="font-bold text-primary-text truncate" title={repo.full_name}>
                        {repo.full_name.split("/")[1]}
                      </h4>
                      <span className="text-[10px] text-secondary-text block truncate" title={repo.full_name}>
                        {repo.full_name.split("/")[0]}
                      </span>
                    </div>
                    {isOnboarded ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded bg-success/15 border border-success/20 text-success text-[10px] font-bold">
                        <Check className="h-3.5 w-3.5" /> Onboarded
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOnboard(repo.full_name, repo.installation_id)}
                        className="px-2.5 py-1 bg-info text-primary-text font-bold text-[10px] rounded hover:bg-info/90 whitespace-nowrap"
                      >
                        Onboard
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
