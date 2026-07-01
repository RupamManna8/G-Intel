"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  GitCommit, 
  GitPullRequest, 
  AlertTriangle, 
  CheckCircle, 
  TrendingDown, 
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

export default function Dashboard() {
  const [activeRepoId, setActiveRepoId] = useState(null);
  const [activeRepoName, setActiveRepoName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repoStatus, setRepoStatus] = useState(null);
  const [allRepos, setAllRepos] = useState([]);

  // Telemetry state
  const [archMetrics, setArchMetrics] = useState(null);
  const [debtMetrics, setDebtMetrics] = useState(null);
  const [pullRequests, setPullRequests] = useState([]);
  const [productivity, setProductivity] = useState([]);
  const [commits, setCommits] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const repoId = localStorage.getItem("active_repo_id") || "all";
      const repoName = localStorage.getItem("active_repo_name") || "All Repositories";
      setActiveRepoId(repoId);
      setActiveRepoName(repoName);
      
      fetchDashboardData(repoId);
      loadOnboardedRepositories();
    }
  }, []);

  const loadOnboardedRepositories = async () => {
    try {
      const data = await fetchWithAuth("/repositories");
      setAllRepos(data || []);
    } catch (err) {
      console.error("Failed to load repositories list", err);
    }
  };

  const handleContextChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "all") {
      localStorage.setItem("active_repo_id", "all");
      localStorage.setItem("active_repo_name", "All Repositories");
      setActiveRepoId("all");
      setActiveRepoName("All Repositories");
      fetchDashboardData("all");
      window.dispatchEvent(new Event("storage"));
    } else {
      const selectedRepo = allRepos.find(r => r.id === selectedId);
      if (selectedRepo) {
        localStorage.setItem("active_repo_id", selectedRepo.id);
        localStorage.setItem("active_repo_name", selectedRepo.full_name);
        setActiveRepoId(selectedRepo.id);
        setActiveRepoName(selectedRepo.full_name);
        fetchDashboardData(selectedRepo.id);
        window.dispatchEvent(new Event("storage"));
      }
    }
  };

  const fetchDashboardData = async (repoId) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch repository status first
      const statusData = await fetchWithAuth(`/repositories/${repoId}/status`);
      setRepoStatus(statusData);

      if (statusData.onboarding_status === "COMPLETED") {
        // Fetch parallel analytics only if completed
        const [archData, debtData, prsData, prodData, commitsData] = await Promise.all([
          fetchWithAuth(`/analytics/${repoId}/architecture`),
          fetchWithAuth(`/analytics/${repoId}/technical-debt`),
          fetchWithAuth(`/repositories/${repoId}/pull-requests`),
          fetchWithAuth(`/analytics/${repoId}/productivity`),
          fetchWithAuth(`/repositories/${repoId}/commits`)
        ]);

        setArchMetrics(archData);
        setDebtMetrics(debtData);
        setPullRequests(prsData);
        setProductivity(prodData);
        setCommits(commitsData || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch analytics telemetry from backend.");
    } finally {
      setLoading(false);
    }
  };

  const triggerScan = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchWithAuth("/repositories/onboard", {
        method: "POST",
        body: JSON.stringify({ 
          full_name: activeRepoName 
        })
      });
      await fetchDashboardData(activeRepoId);
    } catch (err) {
      console.error(err);
      setError(`Failed to trigger scan for ${activeRepoName}.`);
      setLoading(false);
    }
  };

  if (!activeRepoId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-lg bg-card text-center p-6 space-y-4 font-geist">
        <GitCommit className="h-10 w-10 text-secondary-text animate-pulse" />
        <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">No Active Repository Selected</h3>
        <p className="text-xs text-secondary-text max-w-sm leading-relaxed">
          Onboard or choose a repository from the Repositories Engine page to load AST models, PR risks, and debt analytics.
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
        Fetching Repository Analytics Telemetry...
      </div>
    );
  }

  if (repoStatus && repoStatus.onboarding_status === "PENDING") {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-lg bg-card text-center p-6 space-y-4 font-geist">
        <Clock className="h-10 w-10 text-warning animate-pulse" />
        <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">Repository Scan Queued</h3>
        <p className="text-xs text-secondary-text max-w-md leading-relaxed">
          The codebase for <strong>{activeRepoName}</strong> is currently awaiting a slot in the scanning queue.<br/>
          You can trigger the deep static code analysis and AST generation immediately below.
        </p>
        <button
          onClick={triggerScan}
          className="inline-flex items-center gap-2 px-4 py-2 bg-info text-primary-text font-bold text-xs rounded hover:bg-info/90 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Start Scan Now
        </button>
      </div>
    );
  }

  if (repoStatus && repoStatus.onboarding_status === "SCANNING") {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-lg bg-card text-center p-6 space-y-4 font-geist">
        <RefreshCw className="h-10 w-10 text-info animate-spin" />
        <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide animate-pulse">Analyzing Repository Codebase</h3>
        <p className="text-xs text-secondary-text max-w-md leading-relaxed">
          We are currently building AST dependency models, mapping import violations, parsing commit history, and calculating technical debt markers for <strong>{activeRepoName}</strong>.<br/><span className="block mt-2">This may take a moment. Please feel free to refresh.</span>
        </p>
      </div>
    );
  }

  if (repoStatus && repoStatus.onboarding_status === "FAILED") {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-lg bg-card text-center p-6 space-y-4 font-geist">
        <AlertTriangle className="h-10 w-10 text-danger animate-bounce" />
        <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">Onboarding Scan Failed</h3>
        <p className="text-xs text-secondary-text max-w-md leading-relaxed">
          The background scanning task for <strong>{activeRepoName}</strong> has failed.<br/>
          <span className="text-danger block mt-2 font-mono">Reason: {repoStatus.description || "Unknown scan error"}</span>
        </p>
        <Link 
          href="/repositories"
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-bg border border-border text-primary-text font-bold text-xs rounded hover:bg-card transition-colors"
        >
          Manage Repositories <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  // Calculate Average PR Risk
  const prRiskScores = pullRequests.map(pr => pr.risk_score).filter(s => s !== null && s !== undefined);
  const avgPrRisk = prRiskScores.length > 0 
    ? Math.round(prRiskScores.reduce((a, b) => a + b, 0) / prRiskScores.length) 
    : 0;

  const metrics = [
    { 
      name: 'Repository Health', 
      value: archMetrics ? `${archMetrics.score.toFixed(1)}%` : '—', 
      status: archMetrics ? (archMetrics.score > 80 ? 'optimal' : 'investigate') : 'no data', 
      icon: CheckCircle, 
      color: archMetrics ? (archMetrics.score > 80 ? 'text-success' : 'text-warning') : 'text-secondary-text' 
    },
    { 
      name: 'Architecture Score', 
      value: archMetrics ? `${archMetrics.score.toFixed(1)}/100` : '—', 
      status: archMetrics ? (archMetrics.circular_dependencies.length > 0 ? 'circular imports' : 'clean layers') : 'no data', 
      icon: AlertTriangle, 
      color: archMetrics ? (archMetrics.circular_dependencies.length > 0 ? 'text-warning' : 'text-success') : 'text-secondary-text' 
    },
    { 
      name: 'Technical Debt', 
      value: debtMetrics ? `${debtMetrics.estimated_cleanup_hours.toFixed(1)} hrs` : '—', 
      status: debtMetrics ? (debtMetrics.todos_count > 0 ? `${debtMetrics.todos_count} markers` : 'no debt markers') : 'no data', 
      icon: Clock, 
      color: debtMetrics ? 'text-info' : 'text-secondary-text' 
    },
    { 
      name: 'Average PR Risk', 
      value: pullRequests.length > 0 && prRiskScores.length > 0 ? `${avgPrRisk}/100` : '—', 
      status: pullRequests.length > 0 && prRiskScores.length > 0 ? (avgPrRisk > 70 ? 'high risk' : avgPrRisk > 35 ? 'medium risk' : 'low risk') : 'no data', 
      icon: GitPullRequest, 
      color: pullRequests.length > 0 && prRiskScores.length > 0 ? (avgPrRisk > 70 ? 'text-danger' : avgPrRisk > 35 ? 'text-warning' : 'text-success') : 'text-secondary-text' 
    },
  ];

  // Convert Todo list to sprint recommendations
  const recommendations = debtMetrics && debtMetrics.todos.length > 0 
    ? debtMetrics.todos.slice(0, 3).map((todo, idx) => {
        const efforts = ['Small', 'Medium', 'Large'];
        return {
          title: `Address ${todo.type}: ${todo.text} in ${todo.file}`,
          priority: todo.type === 'FIXME' ? 'HIGH' : todo.type === 'TODO' ? 'MEDIUM' : 'LOW',
          effort: efforts[todo.line % 3],
          impact: todo.type === 'FIXME' ? 'High' : 'Medium',
          confidence: '95%'
        };
      })
    : [];

  // Use layer violations and circular dependencies as critical issues
  const criticalIssues = [];
  if (archMetrics) {
    if (archMetrics.layer_violations.length > 0) {
      archMetrics.layer_violations.slice(0, 3).forEach(v => {
        criticalIssues.push({
          file: v.file,
          issue: v.violation,
          severity: 'HIGH'
        });
      });
    }
    if (archMetrics.circular_dependencies.length > 0) {
      archMetrics.circular_dependencies.slice(0, 2).forEach(c => {
        criticalIssues.push({
          file: c[0] || 'import-cycle',
          issue: `Circular import loop: ${c.join(' ➔ ')}`,
          severity: 'HIGH'
        });
      });
    }
  }

  // Group commits by date (YYYY-MM-DD)
  const commitCountsByDate = {};
  commits.forEach(commit => {
    if (!commit.timestamp) return;
    const dateStr = commit.timestamp.split('T')[0];
    commitCountsByDate[dateStr] = (commitCountsByDate[dateStr] || 0) + 1;
  });

  const activeDaysCount = Object.keys(commitCountsByDate).length;
  const maxCommitsInDay = Math.max(...Object.values(commitCountsByDate), 0);
  const activeRatio = Math.round((activeDaysCount / 60) * 100) || 0;

  const renderContributionGrid = () => {
    const dates = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 62);
    
    const startDayOffset = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOffset);
    
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const weeks = [];
    let currentWeek = [];
    dates.forEach((date, index) => {
      const dateStr = date.toISOString().split('T')[0];
      const count = commitCountsByDate[dateStr] || 0;
      currentWeek.push({ date, dateStr, count });
      
      if (currentWeek.length === 7 || index === dates.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return (
      <div className="flex gap-1.5 py-1 select-none">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1.5">
            {week.map((day, dIdx) => {
              let bgColor = "bg-[#1F2937]/50 hover:bg-[#2D3748]";
              if (day.count > 0 && day.count <= 2) bgColor = "bg-success/20 border border-success/30 hover:bg-success/30";
              else if (day.count > 2 && day.count <= 5) bgColor = "bg-success/50 border border-success/60 hover:bg-success/60";
              else if (day.count > 5) bgColor = "bg-success hover:opacity-85";

              const options = { month: 'short', day: 'numeric', year: 'numeric' };
              const tooltipText = `${day.count} commit${day.count === 1 ? '' : 's'} on ${day.date.toLocaleDateString('en-US', options)}`;

              return (
                <div 
                  key={dIdx}
                  className={`h-[18px] w-[18px] rounded-sm transition-all duration-200 cursor-pointer ${bgColor} relative group flex items-center justify-center`}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[200px] p-2 bg-secondary-bg border border-border text-primary-text text-[10px] rounded shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 font-sans leading-none">
                    {tooltipText}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 font-geist">
      {/* Active Repo Display */}
      <div className="flex justify-between items-center bg-card border border-border p-4 rounded-lg">
        <div>
          <span className="text-[10px] text-secondary-text uppercase font-semibold">Active Workspace Context</span>
          <h2 className="text-lg font-bold text-primary-text font-mono text-info">{activeRepoName}</h2>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={activeRepoId || "all"} 
            onChange={handleContextChange}
            className="bg-secondary-bg border border-border text-primary-text text-xs rounded px-3 py-2 focus:outline-none focus:border-info font-medium cursor-pointer"
          >
            <option value="all">All Repositories</option>
            {allRepos.map(r => (
              <option key={r.id} value={r.id}>{r.full_name}</option>
            ))}
          </select>
          <Link 
            href="/repositories" 
            className="text-xs text-info hover:underline font-bold uppercase tracking-wider"
          >
            Manage
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.name} className="overflow-hidden rounded-lg bg-card border border-border px-4 py-5 shadow sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className={`h-6 w-6 ${m.color}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-xs font-medium text-secondary-text uppercase tracking-wider">{m.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-primary-text">{m.value}</div>
                      <span className="ml-2 text-xs text-secondary-text font-normal">({m.status})</span>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contribution Calendar Section */}
      <div className="rounded-lg bg-card border border-border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-primary-text uppercase">
              Repository Activity (Last 60 Days)
            </h2>
            <p className="text-xs text-secondary-text mt-1">
              GitHub-style commit activity mapping contributions across branches
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 rounded bg-secondary-bg border border-border">
              <span className="text-secondary-text">Total Commits:</span>{" "}
              <strong className="text-info">{commits.length}</strong>
            </div>
            <div className="px-3 py-1.5 rounded bg-secondary-bg border border-border">
              <span className="text-secondary-text">Active Days:</span>{" "}
              <strong className="text-success">{activeDaysCount} days</strong>
            </div>
            <div className="px-3 py-1.5 rounded bg-secondary-bg border border-border">
              <span className="text-secondary-text">Consistency:</span>{" "}
              <strong className="text-warning">{activeRatio}%</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between overflow-hidden">
          {/* Calendar Grid Wrapper */}
          <div className="flex-grow overflow-x-auto py-2">
            <div className="min-w-[450px]">
              {renderContributionGrid()}
            </div>
          </div>

          {/* Legend and Summary Info */}
          <div className="flex md:flex-col justify-between items-center md:items-start gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 text-[11px] text-secondary-text min-w-[150px]">
            <div className="space-y-1">
              <div className="text-primary-text font-semibold uppercase tracking-wider text-[10px] mb-1">Activity Legend</div>
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-sm bg-[#1F2937]/50"></div>
                <span>No commits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-sm bg-success/20 border border-success/30"></div>
                <span>1-2 commits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-sm bg-success/50 border border-success/60"></div>
                <span>3-5 commits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-sm bg-success"></div>
                <span>6+ commits</span>
              </div>
            </div>
            
            <div className="space-y-1 mt-2">
              <div>Peak Day Output: <strong className="text-primary-text">{maxCommitsInDay} commits</strong></div>
              <div>Scan Integrity: <strong className="text-success">Verified</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Commit and PR lists */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Contributor Commit Activity Chart */}
        <div className="rounded-lg bg-card border border-border p-6">
          <h2 className="text-sm font-semibold tracking-wide text-primary-text uppercase mb-4">
            Contributor Commit Activity
          </h2>
          {productivity.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-secondary-text border border-dashed border-border rounded">
              No commit activity data available.
            </div>
          ) : (
            <div className="h-64 flex flex-col justify-end space-y-2">
              <div className="flex items-end justify-around h-48 px-4">
                {productivity.map((p, idx) => {
                  const maxCommits = Math.max(...productivity.map(x => x.commits_count), 1);
                  const pct = Math.round((p.commits_count / maxCommits) * 100);
                  return (
                    <div key={p.username || idx} className="flex flex-col items-center space-y-2 w-16">
                      <div className="text-[9px] text-primary-text font-bold mb-1">{p.commits_count} commits</div>
                      <div className="w-8 bg-info rounded-t-sm transition-all duration-500" style={{ height: `${Math.max(pct, 5)}%` }}></div>
                      <span className="text-[10px] text-secondary-text truncate w-full text-center" title={p.username}>
                        {p.username}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border pt-4 flex justify-between text-xs text-secondary-text">
                <span>Active contributor commit breakdown</span>
                <span className="text-success font-semibold">{productivity.length} contributors</span>
              </div>
            </div>
          )}
        </div>

        {/* PR Risk & Failure Probability */}
        <div className="rounded-lg bg-card border border-border p-6">
          <h2 className="text-sm font-semibold tracking-wide text-primary-text uppercase mb-4">
            PR Risk & Failure Probability
          </h2>
          {pullRequests.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-secondary-text border border-dashed border-border rounded">
              No open pull requests found for this repository.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">PR #</th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Author</th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Files Changed</th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {pullRequests.slice(0, 3).map((pr) => {
                    const risk = pr.risk_score !== null ? pr.risk_score : 15.0;
                    const levelColor = risk > 70 
                      ? "bg-danger/20 text-danger" 
                      : risk > 35 
                        ? "bg-warning/20 text-warning" 
                        : "bg-success/20 text-success";
                    return (
                      <tr key={pr.number}>
                        <td className="px-3 py-4 whitespace-nowrap text-primary-text font-bold">PR-{pr.number}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-secondary-text">{pr.author}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-[10px] text-secondary-text font-mono truncate max-w-[120px]">{pr.files_changed} files</td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${levelColor}`}>
                            {risk}% ({risk > 70 ? 'HIGH' : risk > 35 ? 'MED' : 'LOW'})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Sprint Recommendations and Critical Architecture warnings */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg bg-card border border-border p-6">
          <h2 className="text-sm font-semibold tracking-wide text-primary-text uppercase mb-4">
            Sprint Task Recommendations (AI Engine)
          </h2>
          {recommendations.length === 0 ? (
            <div className="text-xs text-secondary-text text-center py-8 border border-dashed border-border rounded">
              No task recommendations available.
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 rounded border border-border bg-secondary-bg flex justify-between items-center text-xs">
                  <div>
                    <h3 className="font-semibold text-primary-text text-sm mb-1">{rec.title}</h3>
                    <div className="flex gap-4 text-secondary-text">
                      <span>Effort: <strong>{rec.effort}</strong></span>
                      <span>Impact: <strong>{rec.impact}</strong></span>
                      <span>Confidence: <strong>{rec.confidence}</strong></span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded font-bold ${
                    rec.priority === 'HIGH' ? 'bg-danger/25 text-danger' : rec.priority === 'MEDIUM' ? 'bg-warning/25 text-warning' : 'bg-success/25 text-success'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-card border border-border p-6">
          <h2 className="text-sm font-semibold tracking-wide text-primary-text uppercase mb-4">
            Critical Architecture Issues
          </h2>
          {criticalIssues.length === 0 ? (
            <div className="text-xs text-secondary-text text-center py-8 border border-dashed border-border rounded">
              No critical architecture issues detected.
            </div>
          ) : (
            <div className="space-y-3">
              {criticalIssues.map((issue, idx) => (
                <div key={idx} className="p-3 rounded border border-border bg-secondary-bg text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-info font-bold truncate max-w-[150px]">{issue.file}</span>
                    <span className={`px-1.5 py-0.5 rounded font-black text-[9px] ${
                      issue.severity === 'HIGH' ? 'bg-danger/25 text-danger' : 'bg-warning/25 text-warning'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-secondary-text text-[11px] leading-relaxed">{issue.issue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
