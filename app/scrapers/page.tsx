"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { SelfHealingEvidencePanel } from "@/components/evidence-panel";
import { RefreshCw, ExternalLink, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScrapersPage() {
  const [scrapers, setScrapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<"ALL" | "MONITORED" | "UNMONITORED">("ALL");

  const loadScrapers = useCallback(() => {
    setLoading(true);
    fetch("/api/scrapers")
      .then((res) => res.json())
      .then((data) => setScrapers(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Failed to load scrapers:", err);
        setScrapers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadScrapers();
  }, [loadScrapers]);

  async function handleTriggerScrape(scraperId: number) {
    setTriggeringId(scraperId);
    try {
      await fetch("/api/scrapers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scraperId }),
      });
      loadScrapers();
    } catch (err) {
      console.error("Trigger scrape failed:", err);
    } finally {
      setTriggeringId(null);
    }
  }

  const safeScrapers = useMemo(() => (Array.isArray(scrapers) ? scrapers : []), [scrapers]);

  const filteredScrapers = useMemo(() => {
    if (filterMode === "MONITORED") return safeScrapers.filter((s) => s.isMonitored);
    if (filterMode === "UNMONITORED") return safeScrapers.filter((s) => !s.isMonitored);
    return safeScrapers;
  }, [safeScrapers, filterMode]);

  const monitoredCount = safeScrapers.filter((s) => s.isMonitored).length;

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans transition-colors duration-150">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800 border-zinc-200 pb-5">
          <div>
            <h1 className="text-xl font-bold dark:text-white text-zinc-900 tracking-tight">Scraper Operations</h1>
            <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-0.5 font-mono">
              Target portal telemetry, DOM drift detection, and automated selector self-healing
            </p>
          </div>

          <button
            onClick={loadScrapers}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/80 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 px-3 py-1.5 text-xs dark:text-zinc-300 text-zinc-700 transition-colors shadow-xs"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Factual Self-Healing Evidence Panel */}
        <SelfHealingEvidencePanel />

        {/* Scraper Operations Table */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold dark:text-white text-zinc-900 uppercase tracking-wider font-mono">
              Target Career Portals ({filteredScrapers.length})
            </h2>

            {/* Filter Tabs */}
            <div className="flex items-center rounded border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-white p-0.5 text-xs font-medium shadow-xs">
              <button
                onClick={() => setFilterMode("ALL")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] transition-colors",
                  filterMode === "ALL"
                    ? "dark:bg-zinc-800 bg-zinc-100 dark:text-white text-zinc-900 font-semibold"
                    : "dark:text-zinc-400 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                All ({safeScrapers.length})
              </button>
              <button
                onClick={() => setFilterMode("MONITORED")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] transition-colors",
                  filterMode === "MONITORED"
                    ? "dark:bg-blue-500/20 bg-blue-100 dark:text-blue-400 text-blue-700 font-semibold"
                    : "dark:text-zinc-400 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                Monitored ({monitoredCount})
              </button>
              <button
                onClick={() => setFilterMode("UNMONITORED")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] transition-colors",
                  filterMode === "UNMONITORED"
                    ? "dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-800 font-semibold"
                    : "dark:text-zinc-400 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                Unmonitored ({safeScrapers.length - monitoredCount})
              </button>
            </div>
          </div>

          <div className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/30 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/80 bg-zinc-50 text-[10px] font-mono uppercase dark:text-zinc-400 text-zinc-600">
                  <th className="py-2.5 px-4">Company</th>
                  <th className="py-2.5 px-3">Collector ID</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Extraction Accuracy</th>
                  <th className="py-2.5 px-3">Last Scrape</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800/50 divide-zinc-100">
                {loading && filteredScrapers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs dark:text-zinc-500 text-zinc-400 font-mono">
                      Loading scraper operations...
                    </td>
                  </tr>
                )}
                {filteredScrapers.map((s) => (
                  <tr key={s.id} className="hover:dark:bg-zinc-800/40 hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold dark:text-white text-zinc-900 truncate max-w-[180px]">
                          {s.companyName || s.name}
                        </span>
                        {s.isMonitored && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded dark:bg-blue-500/10 bg-blue-100 dark:text-blue-400 text-blue-700 border dark:border-blue-500/20 border-blue-200 shrink-0">
                            Monitored
                          </span>
                        )}
                      </div>
                      <a
                        href={s.careersUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] dark:text-zinc-500 text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-800 font-mono inline-flex items-center gap-1 mt-0.5"
                      >
                        Careers Portal
                        <ExternalLink size={9} />
                      </a>
                    </td>
                    <td className="py-3 px-3 dark:text-zinc-400 text-zinc-600 font-mono text-[11px]">
                      {s.collectorId || "col_main"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={cn(
                          "font-mono text-[11px] px-2 py-0.5 rounded font-medium inline-flex items-center gap-1.5 uppercase",
                          s.status === "HEALTHY"
                            ? "dark:text-emerald-400 text-emerald-700 dark:bg-emerald-950/40 bg-emerald-100 border dark:border-emerald-500/20 border-emerald-300"
                            : s.status === "RECOVERED"
                            ? "dark:text-purple-400 text-purple-700 dark:bg-purple-950/40 bg-purple-100 border dark:border-purple-500/20 border-purple-300"
                            : "dark:text-amber-400 text-amber-700 dark:bg-amber-950/40 bg-amber-100 border dark:border-amber-500/20 border-amber-300"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            s.status === "HEALTHY"
                              ? "bg-emerald-500"
                              : s.status === "RECOVERED"
                              ? "bg-purple-500"
                              : "bg-amber-500"
                          )}
                        />
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full dark:bg-zinc-800 bg-zinc-200 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              (s.extractionScore || 0) >= 80
                                ? "bg-emerald-500"
                                : (s.extractionScore || 0) >= 50
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            )}
                            style={{ width: `${s.extractionScore || 0}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] dark:text-zinc-300 text-zinc-700 font-medium">
                          {s.extractionScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 dark:text-zinc-400 text-zinc-600 font-mono text-[11px]">
                      {s.lastRunAt ? new Date(s.lastRunAt).toLocaleTimeString() : "Pending"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleTriggerScrape(s.id)}
                        disabled={triggeringId === s.id}
                        className="rounded border dark:border-zinc-700 border-zinc-300 dark:bg-zinc-800 bg-white hover:dark:bg-zinc-700 hover:bg-zinc-100 px-2.5 py-1 text-xs dark:text-zinc-200 text-zinc-800 font-medium transition-colors inline-flex items-center gap-1 shadow-xs"
                      >
                        <Play size={10} className={cn(triggeringId === s.id && "hidden")} />
                        <RefreshCw size={10} className={cn(triggeringId !== s.id && "hidden", "animate-spin")} />
                        {triggeringId === s.id ? "Scraping..." : "Run"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
