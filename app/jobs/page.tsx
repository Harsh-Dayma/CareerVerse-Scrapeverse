"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { SevenDInspector } from "@/components/seven-d-inspector";
import {
  Search,
  Building,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState("All");
  const [domain, setDomain] = useState("All");
  const [monitoredOnly, setMonitoredOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const loadJobs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (workMode !== "All") params.set("workMode", workMode);
    if (domain !== "All") params.set("domain", domain);
    if (monitoredOnly) params.set("monitoredOnly", "true");

    fetch(`/api/jobs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [search, workMode, domain, monitoredOnly]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const safeJobs = useMemo(() => (Array.isArray(jobs) ? jobs : []), [jobs]);

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans transition-colors duration-150">
      <Sidebar />

      {/* Main Content Area — Always 100% visible, fully interactive, and never dimmed (Section 75.1–75.4) */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto space-y-6 animate-fade-in">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800/80 border-zinc-200/90 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold dark:text-white text-zinc-900 tracking-tight">Opportunities Radar</h1>
              <span className="text-[11px] font-mono dark:text-zinc-400 text-zinc-600 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-0.5 rounded-full border dark:border-zinc-700/80 border-zinc-200">
                {safeJobs.length} Indexed Positions
              </span>
            </div>
            <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-1 font-mono">
              Deterministic 7-dimensional scoring against candidate profile and monitored companies
            </p>
          </div>

          <button
            onClick={loadJobs}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/80 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 px-3 py-1.5 text-xs dark:text-zinc-300 text-zinc-700 transition-colors shadow-xs"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 dark:bg-zinc-900/40 bg-white border dark:border-zinc-800/80 border-zinc-200/90 p-3 rounded-xl flex-wrap shadow-xs">
          <div className="relative flex-1 min-w-[220px] w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search title, company, skills, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-slate-50 pl-9 pr-3 py-1.5 text-xs dark:text-white text-zinc-900 placeholder-zinc-400 focus:outline-none dark:focus:border-zinc-700 focus:border-zinc-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Monitored Companies Filter Toggle */}
            <button
              onClick={() => setMonitoredOnly(!monitoredOnly)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 shadow-xs font-medium",
                monitoredOnly
                  ? "dark:border-blue-500/40 border-blue-300 dark:bg-blue-950/40 bg-blue-50 dark:text-blue-400 text-blue-700 font-semibold"
                  : "dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-white dark:text-zinc-400 text-zinc-600 hover:dark:text-zinc-200 hover:text-zinc-900"
              )}
            >
              <Building size={13} />
              Monitored Only
            </button>

            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
              className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-white px-2.5 py-1.5 text-xs dark:text-zinc-300 text-zinc-700 focus:outline-none shadow-xs font-medium"
            >
              <option value="All">All Modes</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>

            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-white px-2.5 py-1.5 text-xs dark:text-zinc-300 text-zinc-700 focus:outline-none shadow-xs font-medium"
            >
              <option value="All">All Domains</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Backend Development">Backend Development</option>
              <option value="Frontend Development">Frontend Development</option>
              <option value="Cloud & DevOps">Cloud & DevOps</option>
              <option value="Data Engineering">Data Engineering</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="AI & Machine Learning">AI & ML</option>
            </select>
          </div>
        </div>

        {/* Opportunity Table */}
        <div className="rounded-xl border dark:border-zinc-800/80 border-zinc-200/90 dark:bg-zinc-900/30 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/80 bg-zinc-50 text-[10px] font-mono uppercase dark:text-zinc-400 text-zinc-600">
                <th className="py-3 px-4">Opportunity</th>
                <th className="py-3 px-3">Company</th>
                <th className="py-3 px-3">Match Score</th>
                <th className="py-3 px-3">Location / Mode</th>
                <th className="py-3 px-3">Compensation</th>
                <th className="py-3 px-4 text-right">Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-zinc-800/50 divide-zinc-100">
              {loading && safeJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-xs dark:text-zinc-500 text-zinc-400 font-mono">
                    Scanning opportunity indexes...
                  </td>
                </tr>
              )}
              {!loading && safeJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-14 text-center space-y-2">
                    <div className="text-xs font-semibold dark:text-zinc-300 text-zinc-800">
                      No matching opportunities found
                    </div>
                    <div className="text-[11px] dark:text-zinc-500 text-zinc-500 font-mono">
                      Try clearing search filters or broadening work mode criteria.
                    </div>
                  </td>
                </tr>
              )}
              {safeJobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={cn(
                    "hover:dark:bg-zinc-800/40 hover:bg-zinc-50/80 transition-colors cursor-pointer group",
                    selectedJob?.id === job.id && "dark:bg-zinc-800/60 bg-zinc-100"
                  )}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold dark:text-white text-zinc-900 truncate max-w-[220px] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
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
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full dark:bg-zinc-800 bg-zinc-200 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            (job.matchScore || 0) >= 80
                              ? "bg-emerald-500"
                              : (job.matchScore || 0) >= 65
                              ? "bg-cyan-500"
                              : "bg-zinc-500"
                          )}
                          style={{ width: `${job.matchScore || 0}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          "font-mono font-bold px-1.5 py-0.2 rounded text-[11px]",
                          (job.matchScore || 0) >= 80
                            ? "dark:text-emerald-400 text-emerald-700 dark:bg-emerald-950/50 bg-emerald-100/80 border dark:border-emerald-500/20 border-emerald-300"
                            : "dark:text-zinc-300 text-zinc-700 dark:bg-zinc-800 bg-zinc-100"
                        )}
                      >
                        {job.matchScore}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 dark:text-zinc-400 text-zinc-600 truncate max-w-[130px]">
                    {job.location} · {job.workMode}
                  </td>
                  <td className="py-3.5 px-3 dark:text-zinc-400 text-zinc-600 font-mono text-[11px] truncate max-w-[120px]">
                    {job.salaryText || "Undisclosed"}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(job);
                      }}
                      className="text-xs dark:text-cyan-400 text-cyan-700 hover:underline font-semibold flex items-center justify-end gap-1 ml-auto"
                    >
                      <Sparkles size={11} />
                      Inspect 7D
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Non-Modal 7D Inspector Side Panel (Section 75.1–75.11) — Zero overlay, zero backdrop, zero screen dimming */}
      <SevenDInspector job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
