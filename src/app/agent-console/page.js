"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Terminal as TerminalIcon, 
  Send, 
  Play, 
  HelpCircle, 
  ArrowRight,
  Database,
  Cpu,
  FileCode,
  AlertCircle
} from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

export default function AgentConsole() {
  const [activeRepoId, setActiveRepoId] = useState(null);
  const [activeRepoName, setActiveRepoName] = useState("");
  const [activeTab, setActiveTab] = useState("qa"); // "qa" or "agent"
  
  // Q&A Tab States
  const [qaQuery, setQaQuery] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResponse, setQaResponse] = useState(null);
  const [qaError, setQaError] = useState(null);

  // Agent Tab States
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentRunning, setAgentRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [agentReport, setAgentReport] = useState(null);
  const [agentError, setAgentError] = useState(null);
  
  const terminalEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const repoId = localStorage.getItem("active_repo_id") || "all";
      const repoName = localStorage.getItem("active_repo_name") || "All Repositories";
      setActiveRepoId(repoId);
      setActiveRepoName(repoName);
    }
  }, []);

  useEffect(() => {
    // Scroll logs window to bottom when new logs arrive
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Handle Q&A Submission
  const handleQaSubmit = async (e) => {
    e.preventDefault();
    if (!qaQuery.trim() || !activeRepoId) return;

    try {
      setQaLoading(true);
      setQaError(null);
      setQaResponse(null);

      const targetRepo = activeRepoId === "all" ? "all" : activeRepoId;
      const data = await fetchWithAuth("/repositories/chat", {
        method: "POST",
        body: JSON.stringify({
          repository_id: targetRepo,
          query: qaQuery.trim()
        })
      });
      
      setQaResponse(data);
    } catch (err) {
      console.error(err);
      setQaError("Failed to query the repository. Please verify database indexing status.");
    } finally {
      setQaLoading(false);
    }
  };

  // Handle Agent Triggering & WebSockets Connect
  const handleAgentRun = async (e) => {
    e.preventDefault();
    if (!agentPrompt.trim() || !activeRepoId) return;

    const targetRepo = activeRepoId === "all" ? "all" : activeRepoId;
    if (targetRepo === "all") {
      setAgentError("Please select a specific repository context from the Dashboard to orchestrate agents.");
      return;
    }

    try {
      setAgentRunning(true);
      setAgentError(null);
      setAgentReport(null);
      setLogs([`[System] Initializing connection for workspace ${activeRepoName}...`]);

      // Connect to websocket
      const wsUrl = `ws://localhost:8000/api/v1/agents/ws/${targetRepo}`;
      setLogs(curr => [...curr, `[System] Opening Socket Channel: ws://localhost:8000/api/v1/agents/ws/${targetRepo}`]);
      
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        setLogs(curr => [...curr, `[System] WebSocket Stream connected. Listening for events...`]);
        // Send a ping to verify connection
        socketRef.current.send("connection_handshake");
      };

      socketRef.current.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          let logLine = "";
          
          if (raw.status === "PONG") {
            logLine = `[System] Agent heartbeat verified. Ready.`;
          } else if (raw.log) {
            logLine = `[Agent] ${raw.log}`;
          } else if (raw.agent && raw.message) {
            logLine = `[${raw.agent}] ${raw.message}`;
          } else {
            logLine = `[Event] ${JSON.stringify(raw)}`;
          }
          setLogs(curr => [...curr, logLine]);
        } catch (ex) {
          setLogs(curr => [...curr, `[Raw Stream] ${event.data}`]);
        }
      };

      socketRef.current.onerror = (err) => {
        setLogs(curr => [...curr, `[System Error] WebSocket stream experienced an interrupt.`]);
      };

      socketRef.current.onclose = () => {
        setLogs(curr => [...curr, `[System] WebSocket disconnected.`]);
      };

      // Trigger the POST endpoint
      setLogs(curr => [...curr, `[System] Dispatched Agent prompt payload to supervisor...`]);
      const data = await fetchWithAuth("/agents/run", {
        method: "POST",
        body: JSON.stringify({
          repository_id: targetRepo,
          prompt: agentPrompt.trim(),
          target_branch: "main"
        })
      });

      setLogs(curr => [...curr, `[System] Supervisor run successfully returned.`]);
      setAgentReport(data);
      
      // Close socket once completed
      if (socketRef.current) {
        socketRef.current.close();
      }
    } catch (err) {
      console.error(err);
      setAgentError("Agent run failed. The workflow plan was interrupted.");
      setLogs(curr => [...curr, `[Fatal] Process stopped: ${err.message || err}`]);
    } finally {
      setAgentRunning(false);
    }
  };

  if (!activeRepoId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-lg bg-card text-center p-6 space-y-4 font-geist">
        <Cpu className="h-10 w-10 text-secondary-text animate-pulse" />
        <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">No Active Repository Selected</h3>
        <p className="text-xs text-secondary-text max-w-sm leading-relaxed">
          Select an onboarded repository to query files, classes, or trigger supervisor workflows.
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

  return (
    <div className="space-y-8 font-geist">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-secondary-text uppercase font-semibold">Active Context: {activeRepoName}</span>
          <h2 className="text-xl font-bold text-primary-text">AI Agent Copilot Console</h2>
          <p className="text-xs text-secondary-text">Semantic search vector database queries and autonomous multi-agent task sweeps</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("qa")}
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "qa" 
              ? "border-info text-info bg-card/10" 
              : "border-transparent text-secondary-text hover:text-primary-text"
          }`}
        >
          <MessageSquare className="h-4 w-4" /> Codebase Semantic Q&A
        </button>
        <button
          onClick={() => setActiveTab("agent")}
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "agent" 
              ? "border-info text-info bg-card/10" 
              : "border-transparent text-secondary-text hover:text-primary-text"
          }`}
        >
          <TerminalIcon className="h-4 w-4" /> Autonomous LangGraph Agent
        </button>
      </div>

      {/* Q&A Tab Content */}
      {activeTab === "qa" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Input Form */}
            <form onSubmit={handleQaSubmit} className="p-6 bg-card border border-border rounded-lg space-y-4">
              <h3 className="text-xs font-semibold text-secondary-text uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-info" /> Ask about this repository
              </h3>
              <textarea
                rows={3}
                placeholder="e.g. Describe how the auth route callback parses user OAuth parameters and saves the token to database."
                value={qaQuery}
                onChange={(e) => setQaQuery(e.target.value)}
                className="w-full bg-secondary-bg border border-border rounded p-3 text-xs text-primary-text focus:outline-none focus:border-info leading-relaxed"
              />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-secondary-text">Semantic match searches up to 6 embedding clusters.</span>
                <button
                  type="submit"
                  disabled={qaLoading || !qaQuery.trim()}
                  className={`px-4 py-2 text-xs font-bold rounded text-primary-text transition-colors flex items-center gap-2 ${
                    qaLoading || !qaQuery.trim() ? "bg-info/50 cursor-not-allowed" : "bg-info hover:bg-info/90"
                  }`}
                >
                  <Send className="h-3.5 w-3.5" /> {qaLoading ? "Searching..." : "Ask Copilot"}
                </button>
              </div>
            </form>

            {/* Error alerts */}
            {qaError && (
              <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs">
                {qaError}
              </div>
            )}

            {/* QA Response */}
            {qaResponse && (
              <div className="p-6 bg-card border border-border rounded-lg space-y-4 font-geist">
                <h3 className="text-xs font-semibold text-secondary-text uppercase tracking-wider border-b border-border pb-2">
                  AI Engineering Answer
                </h3>
                <div className="text-xs text-primary-text leading-relaxed whitespace-pre-wrap font-geist bg-secondary-bg/50 p-4 border border-border rounded">
                  {qaResponse.response}
                </div>
              </div>
            )}
          </div>

          {/* Context Matching Side Card */}
          <div className="space-y-6">
            <div className="p-6 bg-card border border-border rounded-lg flex flex-col h-[500px]">
              <h3 className="text-xs font-semibold text-secondary-text uppercase tracking-wider flex items-center gap-2 mb-4 flex-shrink-0">
                <Database className="h-4 w-4 text-info" /> Codebase Source Matches
              </h3>
              
              <div className="text-[10px] text-secondary-text mb-4 flex-shrink-0">
                Vector database matches mapping AST symbols and module files related to your query.
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {qaLoading ? (
                  <div className="text-xs text-secondary-text text-center py-12 animate-pulse">
                    Scanning vector partitions...
                  </div>
                ) : qaResponse && (qaResponse.context_matches?.matched_files?.length > 0 || qaResponse.context_matches?.matched_symbols?.length > 0) ? (
                  <>
                    {/* Files matches */}
                    {qaResponse.context_matches.matched_files?.map((f, idx) => (
                      <div key={`file-${idx}`} className="p-3 bg-secondary-bg border border-border rounded space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-xs text-info truncate max-w-[120px]">{f.path.split("/").pop()}</span>
                          <span className="text-[8px] bg-info/10 text-info px-1 py-0.2 rounded font-black">FILE</span>
                        </div>
                        <span className="font-mono text-[9px] text-secondary-text block truncate" title={f.path}>{f.path}</span>
                        {f.summary && <p className="text-[10px] text-secondary-text leading-relaxed border-t border-border/50 pt-1 mt-1">{f.summary}</p>}
                      </div>
                    ))}

                    {/* Symbols matches */}
                    {qaResponse.context_matches.matched_symbols?.map((s, idx) => (
                      <div key={`sym-${idx}`} className="p-3 bg-secondary-bg border border-border rounded space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-xs text-success truncate max-w-[120px]">{s.symbol_name}</span>
                          <span className="text-[8px] bg-success/15 text-success px-1 py-0.2 rounded font-black">{s.type?.toUpperCase()}</span>
                        </div>
                        <span className="font-mono text-[9px] text-secondary-text block truncate" title={s.file_path}>{s.file_path}</span>
                        {s.summary && <p className="text-[10px] text-secondary-text leading-relaxed border-t border-border/50 pt-1 mt-1">{s.summary}</p>}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-xs text-secondary-text text-center py-12 border border-dashed border-border rounded">
                    Ask a question to load matching source clusters.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Autonomous Agent Tab Content */}
      {activeTab === "agent" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Control Panel */}
            <div className="lg:col-span-1 space-y-6">
              <form onSubmit={handleAgentRun} className="p-6 bg-card border border-border rounded-lg space-y-4">
                <h3 className="text-xs font-semibold text-secondary-text uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-info" /> Agent Instructions
                </h3>
                <textarea
                  rows={4}
                  placeholder="e.g. Audit the database layer class dependencies for cycles, lint formatting rules, and list recommendations."
                  value={agentPrompt}
                  onChange={(e) => setAgentPrompt(e.target.value)}
                  disabled={agentRunning}
                  className="w-full bg-secondary-bg border border-border rounded p-3 text-xs text-primary-text focus:outline-none focus:border-info leading-relaxed"
                />
                
                {agentError && (
                  <div className="p-3 bg-danger/10 border border-danger/30 text-danger rounded text-[11px] leading-relaxed">
                    {agentError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={agentRunning || !agentPrompt.trim()}
                  className={`w-full py-2.5 text-xs font-bold rounded text-primary-text transition-colors flex items-center justify-center gap-2 ${
                    agentRunning || !agentPrompt.trim() ? "bg-info/50 cursor-not-allowed" : "bg-info hover:bg-info/90"
                  }`}
                >
                  <Play className="h-3.5 w-3.5" /> {agentRunning ? "Running Agent Supervisor..." : "Run Supervisor Task"}
                </button>
              </form>

              <div className="p-6 bg-card border border-border rounded-lg space-y-4">
                <h4 className="text-[10px] text-secondary-text uppercase font-semibold">Autonomous Supervisor Details</h4>
                <p className="text-xs text-secondary-text leading-relaxed">
                  LangGraph coordinates an orchestra of specialized workers:
                </p>
                <ul className="space-y-1.5 text-[11px] text-secondary-text">
                  <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-info" /> <strong>Repository Agent</strong>: Ingest & history</li>
                  <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-success" /> <strong>Architecture Agent</strong>: Cycles & layers</li>
                  <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-warning" /> <strong>Debt Agent</strong>: Scans TODOs & markers</li>
                  <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-danger" /> <strong>Risk Agent</strong>: Predicts regression metrics</li>
                </ul>
              </div>
            </div>

            {/* Logs Terminal Console */}
            <div className="lg:col-span-2 space-y-6 flex flex-col h-[550px]">
              <div className="bg-[#070A0F] border border-border rounded-lg p-4 flex flex-col flex-1 font-mono text-[10px] text-secondary-text shadow-inner">
                <div className="flex justify-between items-center border-b border-border/40 pb-2 mb-3 flex-shrink-0">
                  <span className="text-[9px] uppercase tracking-wider text-info font-black flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-info animate-pulse" /> Agent Process Terminal Output
                  </span>
                  <span className="text-[8px] font-sans text-secondary-text">LOGS STREAMING</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 select-text pr-1">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-secondary-text">
                      <TerminalIcon className="h-8 w-8 text-secondary-text opacity-40 animate-pulse" />
                      <div>Awaiting instruction task trigger...</div>
                    </div>
                  ) : (
                    logs.map((log, idx) => {
                      let colorClass = "text-secondary-text";
                      if (log.startsWith("[System]")) colorClass = "text-info font-semibold";
                      else if (log.startsWith("[Fatal]")) colorClass = "text-danger font-semibold";
                      else if (log.includes("[Architecture]")) colorClass = "text-warning";
                      else if (log.includes("[Debt]")) colorClass = "text-success";
                      else if (log.includes("[Repository]")) colorClass = "text-primary-text";

                      return (
                        <div key={idx} className={`leading-relaxed break-all ${colorClass}`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            </div>
          </div>

          {/* Supervisor execution summary report */}
          {agentReport && (
            <div className="p-6 bg-card border border-border rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-success font-semibold text-xs border-b border-border pb-3 uppercase tracking-wider">
                <CheckCircle className="h-4.5 w-4.5" /> Supervisor Execution Report Summary
              </div>
              <div className="text-xs text-primary-text leading-relaxed whitespace-pre-wrap font-mono bg-secondary-bg/50 p-4 border border-border rounded overflow-x-auto max-h-[400px]">
                {agentReport.response_markdown}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CheckCircle({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
