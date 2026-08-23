"use client";

import React, { useState } from "react";
import { Play, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScraperCardProps = {
  id: number;
  companyName: string;
  careersUrl: string;
  collectorId: string;
  status: "HEALTHY" | "FAILED" | "HEALING" | "RECOVERED" | string;
  extractionScore: number;
  lastRunAt?: string | null;
  lastSuccessAt?: string | null;
  onTrigger?: (id: number) => Promise<void>;
};

export function ScraperHealthCard({
  id,
  companyName,
  careersUrl,
  collectorId,
  status,
  extractionScore,
  lastRunAt,
  onTrigger,
}: ScraperCardProps) {
  const [running, setRunning] = useState(false);

  const statusBadge = {
    HEALTHY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    RECOVERED: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    HEALING: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse",
    FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    DISABLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  }[status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";

  async function handleTrigger() {
    if (!onTrigger || running) return;
    setRunning(true);
    try {
      await onTrigger(id);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">{companyName}</h3>
            <span className={cn("text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase", statusBadge)}>
              {status}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
            <span className="font-mono text-zinc-500 truncate max-w-[200px]">ID: {collectorId}</span>
            <a
              href={careersUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Careers Portal
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <button
          onClick={handleTrigger}
          disabled={running}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 disabled:opacity-50 transition-all"
        >
          <Play size={12} className={cn(running && "hidden")} />
          <RefreshCw size={12} className={cn(!running && "hidden", "animate-spin")} />
          {running ? "Scraping…" : "Trigger Scrape"}
        </button>
      </div>

      {/* Extraction score meter */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-zinc-400 font-medium">Extraction Accuracy</span>
          <span className="font-mono font-bold text-white">{extractionScore}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              extractionScore >= 80 ? "bg-emerald-400" : extractionScore >= 50 ? "bg-amber-400" : "bg-rose-500"
            )}
            style={{ width: `${Math.max(0, Math.min(100, extractionScore))}%` }}
          />
        </div>
      </div>

      {lastRunAt && (
        <div className="mt-3 text-[11px] text-zinc-500 font-mono">
          Last Scrape: {new Date(lastRunAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
