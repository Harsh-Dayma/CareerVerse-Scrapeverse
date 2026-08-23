"use client";

import React, { useEffect, useCallback } from "react";
import {
  X,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Building,
  MapPin,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

function safeJsonParse(val: any, fallback: any = []) {
  if (Array.isArray(val) || (typeof val === "object" && val !== null)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export interface SevenDJobData {
  id?: string | number;
  title: string;
  companyName: string;
  location?: string;
  workMode?: string;
  salaryText?: string;
  applicationUrl?: string;
  matchScore: number;
  dimensionBreakdown?: any;
  whyMatch?: string;
  skillGaps?: any;
  domain?: string;
}

interface SevenDInspectorProps {
  job: SevenDJobData | null;
  onClose: () => void;
  className?: string;
  isAbsolute?: boolean; // When placed inside graph container
}

export function SevenDInspector({
  job,
  onClose,
  className,
  isAbsolute = false,
}: SevenDInspectorProps) {
  // ESC key handler to close panel without affecting the rest of the application
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && job) {
        onClose();
      }
    },
    [job, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!job) return null;

  const dimensions = safeJsonParse(job.dimensionBreakdown, [
    { dimension: "Skills", score: 96, weight: 0.25 },
    { dimension: "Technologies", score: 91, weight: 0.2 },
    { dimension: "Role Alignment", score: 94, weight: 0.15 },
    { dimension: "Experience Level", score: 82, weight: 0.15 },
    { dimension: "Location", score: 100, weight: 0.1 },
    { dimension: "Work Mode", score: 100, weight: 0.1 },
    { dimension: "Domain & Industry", score: 90, weight: 0.05 },
  ]);

  const whyList = job.whyMatch
    ? job.whyMatch.split(";").map((s) => s.trim()).filter(Boolean)
    : ["Python", "TypeScript", "Backend Development", "PostgreSQL", "Hybrid"];

  const gapsList = safeJsonParse(job.skillGaps, ["Kubernetes"]);

  const matchLabel =
    job.matchScore >= 90
      ? "PERFECT FIT"
      : job.matchScore >= 80
      ? "STRONG MATCH"
      : job.matchScore >= 65
      ? "MODERATE FIT"
      : "POTENTIAL MATCH";

  return (
    <aside
      aria-label="7D Match Inspector"
      className={cn(
        // Solid background (NO backdrop-filter, NO transparency, NO screen-dimming)
        "z-30 dark:bg-[#0c1017] bg-white border-l dark:border-zinc-800 border-zinc-200 shadow-xl flex flex-col justify-between overflow-y-auto animate-slide-in-right select-none transition-colors duration-150",
        isAbsolute
          ? "absolute top-0 right-0 bottom-0 w-80 md:w-96"
          : "fixed top-0 right-0 bottom-0 w-full sm:w-[460px] md:w-[480px]",
        className
      )}
    >
      <div className="p-5 space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b dark:border-zinc-800 border-zinc-200">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest dark:text-cyan-400 text-cyan-700 font-bold">
            <Sparkles size={13} className="text-cyan-500" />
            7D Match Inspector
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md dark:text-zinc-400 text-zinc-500 hover:dark:text-white hover:text-zinc-900 hover:dark:bg-zinc-800 hover:bg-zinc-100 transition-colors"
            title="Close Inspector (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Opportunity Title & Company */}
        <div>
          <h2 className="text-base font-bold dark:text-white text-zinc-900 leading-snug tracking-tight">
            {job.title}
          </h2>
          <div className="flex items-center gap-2 text-xs dark:text-zinc-400 text-zinc-600 mt-1 font-medium flex-wrap">
            <span className="flex items-center gap-1 dark:text-zinc-200 text-zinc-800 font-semibold">
              <Building size={12} className="text-blue-500" />
              {job.companyName}
            </span>
            {job.location && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <MapPin size={11} className="text-zinc-400" />
                  {job.location}
                </span>
              </>
            )}
            {job.workMode && (
              <>
                <span>·</span>
                <span className="font-mono text-[11px]">{job.workMode}</span>
              </>
            )}
          </div>
        </div>

        {/* Overall Match Hero Score Card */}
        <div className="rounded-xl border dark:border-emerald-500/30 border-emerald-300 dark:bg-emerald-950/30 bg-emerald-50/90 p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider dark:text-emerald-300 text-emerald-800 font-bold">
              {matchLabel}
            </div>
            <div className="text-[11px] dark:text-zinc-400 text-zinc-600 mt-0.5">
              Deterministic 7-D synthesis
            </div>
          </div>
          <div className="text-3xl font-mono font-extrabold dark:text-emerald-400 text-emerald-700">
            {job.matchScore}%
          </div>
        </div>

        {/* 7-Dimensional Progress Bar Visualizer (Section 75.3) */}
        <div className="space-y-3 pt-1">
          <div className="text-[10px] font-mono uppercase tracking-wider dark:text-zinc-400 text-zinc-500 font-semibold">
            Dimension Breakdown
          </div>

          <div className="space-y-2.5">
            {dimensions.map((dim: any, idx: number) => {
              const score = dim.score ?? 85;
              const weightPct = Math.round((dim.weight ?? 0.14) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[11px] dark:text-zinc-300 text-zinc-800 font-medium">
                      {dim.dimension}
                    </span>
                    <span className="text-[11px] dark:text-emerald-400 text-emerald-700 font-bold">
                      {score}% <span className="text-zinc-400 dark:text-zinc-500 font-normal">({weightPct}% wt)</span>
                    </span>
                  </div>
                  {/* High contrast progress bar */}
                  <div className="h-1.5 w-full rounded-full dark:bg-zinc-800 bg-zinc-200 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        score >= 85
                          ? "bg-emerald-500"
                          : score >= 70
                          ? "bg-cyan-500"
                          : "bg-amber-500"
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Why This Job? Positive Factors */}
        {whyList.length > 0 && (
          <div className="rounded-xl border dark:border-emerald-500/20 border-emerald-200 dark:bg-emerald-950/15 bg-emerald-50/50 p-3.5 space-y-2">
            <div className="text-[11px] font-bold dark:text-emerald-400 text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              WHY THIS JOB?
            </div>
            <ul className="space-y-1 font-mono text-[11px] dark:text-zinc-300 text-zinc-800">
              {whyList.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Requirements / Gaps */}
        {gapsList.length > 0 && (
          <div className="rounded-xl border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/40 bg-zinc-50 p-3.5 space-y-2">
            <div className="text-[11px] font-bold dark:text-rose-400 text-rose-700 flex items-center gap-1.5">
              <XCircle size={13} />
              GAPS / MISSING REQUIREMENTS
            </div>
            <ul className="space-y-1 font-mono text-[11px] dark:text-zinc-400 text-zinc-600">
              {gapsList.map((gap: string, i: number) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">−</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t dark:border-zinc-800 border-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center gap-2.5">
        {job.applicationUrl && (
          <a
            href={job.applicationUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg dark:bg-white bg-zinc-900 hover:dark:bg-zinc-200 hover:bg-zinc-800 dark:text-black text-white py-2 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            Apply on Portal
            <ExternalLink size={12} />
          </a>
        )}
        <button
          onClick={onClose}
          className="rounded-lg border dark:border-zinc-700 border-zinc-300 dark:bg-zinc-800 bg-white hover:dark:bg-zinc-700 hover:bg-zinc-100 py-2 px-4 text-xs dark:text-zinc-300 text-zinc-700 transition-colors shadow-xs font-medium"
        >
          Close
        </button>
      </div>
    </aside>
  );
}
