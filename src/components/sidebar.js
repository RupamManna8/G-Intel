"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  GitFork, 
  GitPullRequest, 
  FolderGit, 
  Binary, 
  ShieldAlert, 
  Users, 
  CalendarDays, 
  Cpu, 
  FilePieChart, 
  Settings 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [username, setUsername] = useState("Developer");

  useEffect(() => {
    const cached = localStorage.getItem("auth_username");
    if (cached) {
      setUsername(cached);
    }
  }, []);

  const initials = username.slice(0, 2).toUpperCase();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Repositories', href: '/repositories', icon: FolderGit },
    { name: 'Architecture', href: '/architecture', icon: Binary },
    { name: 'Technical Debt', href: '/technical-debt', icon: ShieldAlert },
    { name: 'Pull Requests', href: '/pull-requests', icon: GitPullRequest },
    { name: 'Developers', href: '/developers', icon: Users },
    { name: 'Sprint Planning', href: '/sprint-planning', icon: CalendarDays },
    { name: 'Automation', href: '/automation', icon: Cpu },
    { name: 'Reports', href: '/reports', icon: FilePieChart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r border-border font-geist">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="text-lg font-bold tracking-wider text-primary-text flex items-center gap-2">
          <span className="text-info font-black">ENG</span> INTEL
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-secondary-bg text-primary-text border-l-2 border-info'
                  : 'text-secondary-text hover:bg-secondary-bg hover:text-primary-text'
              }`}
            >
              <Icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-info' : 'text-secondary-text group-hover:text-primary-text'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-secondary-bg border border-border flex items-center justify-center font-bold text-sm text-info">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-primary-text">{username}</span>
            <span className="text-[10px] text-secondary-text">Staff Engineer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
