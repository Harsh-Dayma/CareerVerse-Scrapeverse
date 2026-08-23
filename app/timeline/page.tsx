"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { RefreshCw, History, ArrowRight, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTimeline = useCallback(() => {
    setLoading(true);
    fetch("/api/timeline")
      .then((res) => res.json())
      .then((data) => setTimeline(Array.isArray(data) ? data : []))
      .catch(() => setTimeline([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const safeTimeline = useMemo(() => (Array.isArray(timeline) ? timeline : []), [timeline]);

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans transition-colors duration-150">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto overflow-y-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800/80 border-zinc-200/90 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold dark:text-white text-zinc-900 tracking-tight">Living Career Timeline</h1>
              <span className="text-[11px] font-mono dark:text-zinc-400 text-zinc-600 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border dark:border-zinc-700 border-zinc-200">
                {safeTimeline.length} Audited Events
              </span>
            </div>
            <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-1 font-mono">
              Temporal audit feed tracking compensation shifts, requirement additions, and lifecycle diffs
            </p>
          </div>

          <button
            onClick={loadTimeline}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/80 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 px-3.5 py-1.5 text-xs dark:text-zinc-300 text-zinc-700 transition-colors shadow-xs"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh Feed
          </button>
        </div>

        {/* Chronological Event Stream (Section 74.16) */}
        <div className="space-y-4">
          {loading && safeTimeline.length === 0 && (
            <div className="py-16 text-center text-xs dark:text-zinc-500 text-zinc-400 font-mono">
              Loading temporal career stream...
            </div>
          )}

          {!loading && safeTimeline.length === 0 && (
            <div className="rounded-xl border dark:border-zinc-800/80 border-zinc-200/90 dark:bg-zinc-900/30 bg-white p-12 text-center space-y-2 shadow-xs">
              <History size={24} className="mx-auto text-zinc-400" />
              <div className="text-xs font-semibold dark:text-zinc-200 text-zinc-800">
                No Temporal Changes Detected Yet
              </div>
              <p className="text-[11px] dark:text-zinc-500 text-zinc-500 font-mono">
                Run a scraper scan or execute the self-healing demo to generate field-level diffs.
              </p>
            </div>
          )}

          {safeTimeline.map((item, idx) => {
            const date = new Date(item.detectedAt);
            const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

            return (
              <div
                key={item.id || idx}
                className="rounded-xl border dark:border-zinc-800/80 border-zinc-200/90 dark:bg-zinc-900/30 bg-white p-4 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-9 w-9 rounded-lg dark:bg-cyan-950/40 bg-cyan-100 border dark:border-cyan-500/30 border-cyan-300 flex items-center justify-center dark:text-cyan-400 text-cyan-700 shrink-0 mt-0.5">
                    <Clock size={16} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold dark:text-white text-zinc-900">
                        {item.jobTitle || "Opportunity Change"}
                      </span>
                      <span className="text-[10px] font-mono dark:bg-zinc-800 bg-zinc-100 px-2 py-0.2 rounded dark:text-zinc-300 text-zinc-700 font-semibold border dark:border-zinc-700 border-zinc-200">
                        {item.companyName}
                      </span>
                    </div>

                    <div className="text-xs dark:text-zinc-400 text-zinc-600 flex items-center gap-2 font-mono text-[11px] flex-wrap">
                      <span className="text-zinc-500">{item.fieldName}:</span>
                      {item.oldValue && (
                        <span className="line-through text-zinc-400 dark:text-zinc-500">
                          {item.oldValue}
                        </span>
                      )}
                      {item.oldValue && <ArrowRight size={11} className="text-zinc-400" />}
                      <span className="dark:text-emerald-400 text-emerald-700 font-bold">
                        {item.newValue}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 font-mono text-[11px] dark:text-zinc-500 text-zinc-400 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 dark:border-zinc-800/80 border-zinc-100 pt-2 sm:pt-0">
                  <span className="font-semibold dark:text-zinc-300 text-zinc-700">{timeStr}</span>
                  <span className="text-[10px]">{dateStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
