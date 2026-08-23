"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Briefcase,
  Building,
  Share2,
  Activity,
  History,
  User,
  PlayCircle,
  Sun,
  Moon,
  Zap,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface SearchItem {
  id: string;
  type: "page" | "job" | "company" | "action";
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
  badge?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Load data for quick jump
  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setSelectedIndex(0);

    Promise.all([
      fetch("/api/jobs?limit=10").then((r) => r.json()).catch(() => []),
      fetch("/api/scrapers").then((r) => r.json()).catch(() => []),
    ]).then(([jobsData, scrapersData]) => {
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setCompanies(Array.isArray(scrapersData) ? scrapersData : []);
    });
  }, [isOpen]);

  const items: SearchItem[] = [
    // Pages
    {
      id: "page-dashboard",
      type: "page",
      title: "Overview Dashboard",
      subtitle: "Career pulse and telemetry command center",
      icon: Zap,
      badge: "D",
      action: () => {
        router.push("/dashboard");
        onClose();
      },
    },
    {
      id: "page-jobs",
      type: "page",
      title: "Opportunities & 7-D Matching",
      subtitle: "Filter opportunities with deterministic score breakdown",
      icon: Briefcase,
      badge: "J",
      action: () => {
        router.push("/jobs");
        onClose();
      },
    },
    {
      id: "page-graph",
      type: "page",
      title: "Knowledge Graph Explorer",
      subtitle: "Interactive force-directed relational career topology",
      icon: Share2,
      badge: "G",
      action: () => {
        router.push("/graph");
        onClose();
      },
    },
    {
      id: "page-demo",
      type: "page",
      title: "Self-Healing Scraper Demo",
      subtitle: "Step through DOM drift detection, repair, and live recovery",
      icon: PlayCircle,
      badge: "Demo",
      action: () => {
        router.push("/demo");
        onClose();
      },
    },
    {
      id: "page-scrapers",
      type: "page",
      title: "Scraper Radar Operations",
      subtitle: "Monitored portals and self-healing evidence audit",
      icon: Activity,
      badge: "S",
      action: () => {
        router.push("/scrapers");
        onClose();
      },
    },
    {
      id: "page-timeline",
      type: "page",
      title: "Temporal History",
      subtitle: "Chronological feed of salary, requirements, and job diffs",
      icon: History,
      badge: "T",
      action: () => {
        router.push("/timeline");
        onClose();
      },
    },
    {
      id: "page-profile",
      type: "page",
      title: "Candidate Profile & Monitored Companies",
      subtitle: "Edit skills, parse resume, and configure company radar",
      icon: User,
      badge: "P",
      action: () => {
        router.push("/profile");
        onClose();
      },
    },
    // Quick Actions
    {
      id: "action-theme",
      type: "action",
      title: `Toggle Theme (Currently ${resolvedTheme})`,
      subtitle: `Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`,
      icon: resolvedTheme === "dark" ? Sun : Moon,
      badge: "Theme",
      action: () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        onClose();
      },
    },
    // Dynamic Jobs
    ...jobs.map((job) => ({
      id: `job-${job.id}`,
      type: "job" as const,
      title: job.title,
      subtitle: `${job.companyName} · ${job.matchScore}% Match · ${job.location}`,
      icon: Briefcase,
      badge: `${job.matchScore}%`,
      action: () => {
        router.push("/jobs");
        onClose();
      },
    })),
    // Dynamic Companies
    ...companies.map((comp) => ({
      id: `company-${comp.id}`,
      type: "company" as const,
      title: comp.companyName || comp.name,
      subtitle: `${comp.domain} · ${comp.status} · ${comp.extractionScore}% Accuracy`,
      icon: Building,
      badge: comp.isMonitored ? "Monitored" : "Portal",
      action: () => {
        router.push("/profile");
        onClose();
      },
    })),
  ];

  const filteredItems = items.filter((item) => {
    if (!query.trim()) return item.type === "page" || item.type === "action";
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        filteredItems[selectedIndex].action();
      }
    },
    [isOpen, filteredItems, selectedIndex, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="w-full max-w-xl rounded-xl border dark:border-zinc-700/80 border-zinc-200 dark:bg-[#0c1017] bg-white shadow-2xl overflow-hidden flex flex-col transition-colors duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b dark:border-zinc-800 border-zinc-200">
          <Search size={16} className="dark:text-cyan-400 text-cyan-600 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, job title, company, or skill..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm dark:text-white text-zinc-900 placeholder-zinc-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded dark:bg-zinc-800 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono dark:text-zinc-400 text-zinc-500 border dark:border-zinc-700 border-zinc-300">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 && (
            <div className="py-10 text-center text-xs dark:text-zinc-500 text-zinc-400 font-mono">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {filteredItems.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all",
                  isSelected
                    ? "dark:bg-zinc-800 bg-zinc-100 dark:text-white text-zinc-900 shadow-xs"
                    : "dark:text-zinc-400 text-zinc-600 hover:dark:bg-zinc-850 hover:bg-zinc-50"
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <div
                    className={cn(
                      "h-7 w-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "dark:bg-cyan-500/20 bg-cyan-100 dark:text-cyan-400 text-cyan-700"
                        : "dark:bg-zinc-900 bg-zinc-100 dark:text-zinc-400 text-zinc-500"
                    )}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold dark:text-zinc-100 text-zinc-900 truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-[10px] dark:text-zinc-500 text-zinc-500 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold shrink-0 uppercase",
                      item.type === "job"
                        ? "dark:bg-emerald-950/60 bg-emerald-100 dark:text-emerald-400 text-emerald-800 border dark:border-emerald-500/30 border-emerald-300"
                        : "dark:bg-zinc-900 bg-zinc-200 dark:text-zinc-400 text-zinc-700"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-[#080b10] border-t dark:border-zinc-800 border-zinc-200 text-[10px] font-mono dark:text-zinc-500 text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="dark:text-cyan-400 text-cyan-600 font-semibold flex items-center gap-1">
            <Sparkles size={11} /> CareerVerse Omnisearch
          </span>
        </div>
      </div>
    </div>
  );
}
