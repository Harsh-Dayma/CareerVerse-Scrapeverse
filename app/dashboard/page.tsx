"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { CareerPulse } from "@/components/career-pulse";
import {
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Search,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [topJobs, setTopJobs] = useState<any[]>([]);
  const [scrapers, setScrapers] = useState<any[]>([]);
  const [recentChanges, setRecentChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/metrics").then((r) => r.json()).catch(() => null),
      fetch("/api/jobs?limit=6").then((r) => r.json()).catch(() => []),
      fetch("/api/scrapers").then((r) => r.json()).catch(() => []),
      fetch("/api/timeline").then((r) => r.json()).catch(() => []),
    ])
      .then(([metricsData, jobsData, scrapersData, timelineData]) => {
        setMetrics(metricsData);
        setTopJobs(Array.isArray(jobsData) ? jobsData.slice(0, 6) : []);
        setScrapers(Array.isArray(scrapersData) ? scrapersData.slice(0, 5) : []);
        setRecentChanges(Array.isArray(timelineData) ? timelineData.slice(0, 5) : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans transition-colors duration-150">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto space-y-8 animate-fade-in">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800/80 border-zinc-200/90 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold dark:text-white text-zinc-900 tracking-tight">Overview Command Center</h1>
              <span className="text-[10px] font-mono dark:bg-emerald-950/60 bg-emerald-100 dark:text-emerald-400 text-emerald-700 dark:border-emerald-500/30 border-emerald-300 border px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Active
              </span>
            </div>
            <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-1 font-mono">
              Autonomous career page monitoring, self-healing scraper pipelines, and deterministic 7-D matching
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/80 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 p-2 dark:text-zinc-400 text-zinc-600 dark:hover:text-white hover:text-zinc-900 transition-colors shadow-xs"
              title="Refresh Telemetry"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Hero Experience: Career Pulse Instrument (Section 74.4 & 74.14) */}
        <CareerPulse metrics={metrics} />

        {/* Living Knowledge Graph Centerpiece (Sections 74.5 – 74.8) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold dark:text-white text-zinc-900 uppercase tracking-wider font-mono">
                Living Career Network
              </h2>
              <span className="text-[11px] dark:text-zinc-500 text-zinc-500">
                Interactive physical topology linking candidate profile, job matches, companies, and skills
              </span>
            </div>
            <Link
              href="/graph"
              className="text-xs dark:text-cyan-400 text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
            >
              Full Workspace Canvas
              <ArrowRight size={12} />
            </Link>
          </div>

          <KnowledgeGraph />
        </div>

        {/* Two-Column Section: Top Opportunities Table & Live Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Top Opportunities Table (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold dark:text-white text-zinc-900 uppercase tracking-wider font-mono">
                Recommended Opportunities
              </h2>
              <Link
                href="/jobs"
                className="text-xs dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-zinc-900 flex items-center gap-1 font-medium"
              >
                View all ({metrics?.totalJobs ?? 0})
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="rounded-xl border dark:border-zinc-800/80 border-zinc-200/90 dark:bg-zinc-900/30 bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b dark:border-zinc-800/80 border-zinc-200 dark:bg-zinc-900/70 bg-zinc-50 text-[10px] font-mono uppercase dark:text-zinc-400 text-zinc-600">
                    <th className="py-3 px-4">Opportunity</th>
                    <th className="py-3 px-3">Company</th>
                    <th className="py-3 px-3">Match</th>
                    <th className="py-3 px-3">Location / Mode</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-zinc-800/50 divide-zinc-100">
                  {topJobs.map((job) => (
                    <tr key={job.id} className="hover:dark:bg-zinc-800/40 hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold dark:text-white text-zinc-900 truncate max-w-[210px]">
                          {job.title}
                        </div>
                        <div className="text-[10px] dark:text-zinc-500 text-zinc-500 font-mono mt-0.5">
                          {job.domain || "Software Engineering"}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="dark:text-zinc-300 text-zinc-800 font-medium truncate max-w-[130px]">
                            {job.companyName}
                          </span>
                          {job.isMonitored && (
                            <span className="text-[8px] font-mono px-1.5 py-0.2 rounded dark:bg-blue-500/10 bg-blue-100 dark:text-blue-400 text-blue-700 border dark:border-blue-500/20 border-blue-200 shrink-0 font-medium">
                              Monitored
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            "font-mono font-semibold px-2 py-0.5 rounded text-[11px]",
                            (job.matchScore || 0) >= 80
                              ? "dark:text-emerald-400 text-emerald-700 dark:bg-emerald-950/50 bg-emerald-100/80 border dark:border-emerald-500/20 border-emerald-300"
                              : "dark:text-zinc-300 text-zinc-700 dark:bg-zinc-800 bg-zinc-100"
                          )}
                        >
                          {job.matchScore}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 dark:text-zinc-400 text-zinc-600 truncate max-w-[120px]">
                        {job.location} · {job.workMode}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={job.applicationUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="dark:text-cyan-400 text-cyan-700 hover:underline inline-flex items-center gap-1 text-xs font-semibold"
                        >
                          Apply
                          <ExternalLink size={11} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Scrapers & Recent Temporal Activity */}
          <div className="space-y-6">
            {/* Scraper Health Overview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold dark:text-white text-zinc-900 uppercase tracking-wider font-mono">
                  Scraper Radar
                </h2>
                <Link
                  href="/scrapers"
                  className="text-xs dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-zinc-900 flex items-center gap-1 font-medium"
                >
                  Radar Detail
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="rounded-xl border dark:border-zinc-800/80 border-zinc-200/90 dark:bg-zinc-900/30 bg-white divide-y dark:divide-zinc-800/50 divide-zinc-100 shadow-xs">
                {scrapers.map((s) => (
                  <div key={s.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="truncate max-w-[140px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold dark:text-zinc-200 text-zinc-900 truncate">
                          {s.companyName || s.name}
                        </span>
                        {s.isMonitored && (
                          <span className="text-[8px] font-mono px-1 py-0.2 rounded dark:bg-blue-500/10 bg-blue-100 dark:text-blue-400 text-blue-700 border dark:border-blue-500/20 border-blue-200 shrink-0">
                            Monitored
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] dark:text-zinc-500 text-zinc-500 font-mono mt-0.5">
                        Extraction Score: {s.extractionScore}%
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold",
                        s.status === "HEALTHY"
                          ? "dark:text-emerald-400 text-emerald-700 dark:bg-emerald-950/40 bg-emerald-100/80 border dark:border-emerald-500/20 border-emerald-300"
                          : s.status === "RECOVERED"
                          ? "dark:text-purple-400 text-purple-700 dark:bg-purple-950/40 bg-purple-100/80 border dark:border-purple-500/20 border-purple-300"
                          : "dark:text-amber-400 text-amber-700 dark:bg-amber-950/40 bg-amber-100 border dark:border-amber-500/20 border-amber-300"
                      )}
                    >
                      ● {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Changes Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold dark:text-white text-zinc-900 uppercase tracking-wider font-mono">
                  Live Audit Feed
                </h2>
                <Link
                  href="/timeline"
                  className="text-xs dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-zinc-900 flex items-center gap-1 font-medium"
                >
                  Full Feed
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="rounded-xl border dark:border-zinc-800/80 border-zinc-200/90 dark:bg-zinc-900/30 bg-white divide-y dark:divide-zinc-800/50 divide-zinc-100 text-xs shadow-xs">
                {recentChanges.map((ch) => (
                  <div key={ch.id} className="p-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono dark:text-zinc-500 text-zinc-500">
                      <span className="font-semibold">{ch.companyName}</span>
                      <span>{new Date(ch.detectedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="dark:text-zinc-200 text-zinc-900 font-medium truncate">{ch.jobTitle}</div>
                    <div className="text-[11px] font-mono dark:text-zinc-400 text-zinc-600">
                      {ch.fieldName}: {ch.oldValue ? `${ch.oldValue} → ` : ""}{ch.newValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
