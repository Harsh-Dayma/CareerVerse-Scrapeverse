"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Sparkles, MapPin, Building, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export type JobCardProps = {
  id: number;
  title: string;
  company: string;
  location: string;
  workMode: string;
  employmentType?: string | null;
  salaryText?: string | null;
  applicationUrl: string;
  score?: number;
  whyMatch?: string;
  skillGaps?: string[];
  dimensionBreakdown?: {
    label: string;
    score: number;
    weight: number;
    detail: string;
  }[];
  skills?: string[];
  status?: string;
};

export function JobCard({
  id,
  title,
  company,
  location,
  workMode,
  employmentType,
  salaryText,
  applicationUrl,
  score = 75,
  whyMatch,
  skillGaps = [],
  dimensionBreakdown = [],
  skills = [],
  status = "OPEN",
}: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor =
    score >= 85
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : score >= 70
      ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
      : "text-amber-400 border-amber-500/30 bg-amber-500/10";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
            {status === "CLOSED" && (
              <span className="text-[11px] font-mono uppercase rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5">
                CLOSED
              </span>
            )}
            {status === "REOPENED" && (
              <span className="text-[11px] font-mono uppercase rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2 py-0.5">
                REOPENED
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
            <span className="flex items-center gap-1 text-zinc-300 font-medium">
              <Building size={14} className="text-cyan-400" />
              {company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-zinc-500" />
              {location} · {workMode}
            </span>
            {salaryText && (
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <DollarSign size={14} />
                {salaryText}
              </span>
            )}
            {employmentType && (
              <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px]">
                {employmentType}
              </span>
            )}
          </div>

          {skills.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              {skills.slice(0, 5).map((sk) => (
                <span
                  key={sk}
                  className="rounded-lg bg-cyan-500/5 border border-cyan-500/20 px-2 py-0.5 text-[11px] text-cyan-300 font-mono"
                >
                  {sk}
                </span>
              ))}
              {skills.length > 5 && (
                <span className="text-[11px] text-zinc-500 font-mono">+{skills.length - 5} more</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              7-D Match
            </div>
            <div className={cn("text-xl font-bold font-mono px-3 py-1 rounded-xl border mt-0.5", scoreColor)}>
              {score}%
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href={applicationUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all"
            >
              Apply
              <ExternalLink size={13} />
            </a>

            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {expanded ? "Hide Details" : "Why This Job?"}
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable 7-Dimension Explanation */}
      {expanded && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <Sparkles size={16} />
              Deterministic 7-Dimension Match Breakdown
            </div>

            {whyMatch && <p className="mt-2 text-xs text-zinc-300">{whyMatch}</p>}

            {dimensionBreakdown.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dimensionBreakdown.map((d) => (
                  <div key={d.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-medium">{d.label}</span>
                      <span className="font-mono text-cyan-400 font-semibold">{d.score}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: `${Math.max(0, Math.min(100, d.score))}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">{d.detail}</div>
                  </div>
                ))}
              </div>
            )}

            {skillGaps.length > 0 && (
              <div className="mt-4 border-t border-white/5 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                  <AlertCircle size={14} />
                  Requirement Gaps Identified:
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  {skillGaps.map((gap) => (
                    <span
                      key={gap}
                      className="rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[11px] text-rose-300 font-mono"
                    >
                      - {gap}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
