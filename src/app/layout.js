"use client";

import '../styles/index.css';
import Sidebar from '../components/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { fetchWithAuth } from '../lib/api';

function AuthWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [allRepos, setAllRepos] = useState([]);
  const [activeRepoId, setActiveRepoId] = useState("all");
  const [activeRepoName, setActiveRepoName] = useState("All Repositories");

  useEffect(() => {
    try {
      // 1. Check query parameters for token (coming from OAuth callback redirect)
      const params = new URLSearchParams(window.location.search);
      const queryToken = params.get('token');
      const queryUsername = params.get('username');

      let token = queryToken;
      if (queryToken) {
        localStorage.setItem('auth_token', queryToken);
        if (queryUsername) {
          localStorage.setItem('auth_username', queryUsername);
        }
        // Clean up URL parameters so they don't linger in user address bar
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } else {
        // 2. Fallback to localStorage cache
        token = localStorage.getItem('auth_token');
      }

      if (token) {
        setAuthenticated(true);
        // Auto-redirect to dashboard if visiting landing page when logged in
        if (pathname === '/') {
          router.push('/dashboard');
        }
      } else {
        setAuthenticated(false);
        // Redirect to landing if not authenticated
        if (pathname !== '/') {
          router.push('/');
        }
      }
    } catch (err) {
      console.error("Auth validation error:", err);
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    if (authenticated) {
      const storedId = localStorage.getItem("active_repo_id") || "all";
      const storedName = localStorage.getItem("active_repo_name") || "All Repositories";
      setActiveRepoId(storedId);
      setActiveRepoName(storedName);

      const loadOnboardedRepositories = async () => {
        try {
          const data = await fetchWithAuth("/repositories");
          setAllRepos(data || []);
        } catch (err) {
          console.error("Failed to load repositories list in layout", err);
        }
      };
      loadOnboardedRepositories();

      const syncActiveRepo = () => {
        const storedId = localStorage.getItem("active_repo_id") || "all";
        const storedName = localStorage.getItem("active_repo_name") || "All Repositories";
        setActiveRepoId(storedId);
        setActiveRepoName(storedName);
      };
      
      window.addEventListener("storage", syncActiveRepo);
      return () => window.removeEventListener("storage", syncActiveRepo);
    }
  }, [authenticated]);

  const handleContextChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "all") {
      localStorage.setItem("active_repo_id", "all");
      localStorage.setItem("active_repo_name", "All Repositories");
      setActiveRepoId("all");
      setActiveRepoName("All Repositories");
      window.dispatchEvent(new Event("storage"));
      window.location.reload();
    } else {
      const selectedRepo = allRepos.find(r => r.id === selectedId);
      if (selectedRepo) {
        localStorage.setItem("active_repo_id", selectedRepo.id);
        localStorage.setItem("active_repo_name", selectedRepo.full_name);
        setActiveRepoId(selectedRepo.id);
        setActiveRepoName(selectedRepo.full_name);
        window.dispatchEvent(new Event("storage"));
        window.location.reload();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-background text-secondary-text font-geist">
        <div className="text-xs uppercase tracking-widest animate-pulse">Verifying Session Token...</div>
      </div>
    );
  }

  const isLandingPage = pathname === '/';

  return (
    <div className="h-full w-full flex overflow-hidden">
      {isLandingPage ? (
        <div className="flex-1 min-w-0 overflow-y-auto bg-background">
          {children}
        </div>
      ) : (
        <>
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background">
            <div className="flex h-16 items-center justify-between border-b border-border px-8 bg-card">
              <div className="flex items-center gap-6">
                <h1 className="text-sm font-semibold tracking-wide text-primary-text uppercase">
                  Enterprise Dashboard
                </h1>
                
                {authenticated && (
                  <div className="flex items-center gap-2 border-l border-border pl-6">
                    <span className="text-[10px] text-secondary-text uppercase font-semibold font-geist">Workspace:</span>
                    <select
                      value={activeRepoId}
                      onChange={handleContextChange}
                      className="bg-secondary-bg border border-border text-primary-text text-xs rounded px-3 py-1.5 focus:outline-none focus:border-info font-medium cursor-pointer font-geist"
                    >
                      <option value="all">All Repositories</option>
                      {allRepos.map(r => (
                        <option key={r.id} value={r.id}>{r.full_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs font-geist">
                <span className="px-2 py-1 rounded bg-secondary-bg border border-border text-success font-semibold">
                  SYSTEM HEALTHY
                </span>
                <button
                  onClick={() => {
                    localStorage.clear();
                    setAuthenticated(false);
                    router.push('/');
                  }}
                  className="text-danger hover:underline font-semibold uppercase"
                >
                  Logout
                </button>
              </div>
            </div>
            <div className="p-8">
              {children}
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-background text-primary-text font-geist">
      <body className="h-full flex overflow-hidden">
        <Suspense fallback={
          <div className="min-h-screen w-screen flex items-center justify-center bg-background text-secondary-text font-geist">
            <div className="text-xs uppercase tracking-widest">Loading Platform...</div>
          </div>
        }>
          <AuthWrapper>{children}</AuthWrapper>
        </Suspense>
      </body>
    </html>
  );
}


