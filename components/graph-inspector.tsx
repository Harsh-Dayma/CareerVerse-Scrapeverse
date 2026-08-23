"use client";

import React, { useEffect, useCallback } from "react";
import {
  MapPin,
  X,
  PlusCircle,
  MinusCircle,
  Shield,
  Building,
  Briefcase,
  Code,
  Cpu,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
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

export interface InspectorNodeData {
  id: string;
  type: string;
  label: string;
  sublabel?: string;
  score?: number;
  meta?: Record<string, any>;
  isMonitored?: boolean;
}

interface GraphInspectorProps {
  node: InspectorNodeData | null;
  isExpanded: boolean;
  connectionCount: number;
  onClose: () => void;
  onToggleExpand: (nodeId: string) => void;
}

export function GraphInspector({
  node,
  isExpanded,
  connectionCount,
  onClose,
  onToggleExpand,
}: GraphInspectorProps) {
  // ESC key support (Section 75.9)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && node) {
        onClose();
      }
    },
    [node, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!node) return null;

  const isJob = node.type === "job";
  const score = node.score || 75;

  const dimensions = safeJsonParse(node.meta?.dimensionBreakdown, [
    { dimension: "Skills", score: 96, weight: 0.25 },
    { dimension: "Technologies", score: 91, weight: 0.2 },
    { dimension: "Role Alignment", score: 94, weight: 0.15 },
    { dimension: "Experience Level", score: 82, weight: 0.15 },
    { dimension: "Location", score: 100, weight: 0.1 },
    { dimension: "Work Mode", score: 100, weight: 0.1 },
    { dimension: "Domain", score: 90, weight: 0.05 },
  ]);

  const whyList = node.meta?.whyMatch
    ? node.meta.whyMatch.split(";").map((s: string) => s.trim()).filter(Boolean)
    : ["Python", "TypeScript", "Backend Development", "PostgreSQL", "Hybrid"];

  const gapsList = safeJsonParse(node.meta?.skillGaps, ["Kubernetes"]);

  return (
    // Non-modal side inspector (Section 75.1–75.11): Zero transparent overlay, zero backdrop-filter, zero canvas dimming
    <aside
      aria-label="Entity Inspector"
      className="absolute top-16 right-3 bottom-3 w-80 sm:w-96 z-20 rounded-xl border dark:border-zinc-800 border-zinc-200 dark:bg-[#0c1017] bg-white p-4 shadow-2xl flex flex-col justify-between select-none overflow-y-auto animate-slide-in-right transition-colors duration-150"
    >
      <div className="space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2.5 border-b dark:border-zinc-800 border-zinc-200">
          <span className="text-[10px] font-mono uppercase tracking-widest dark:text-cyan-400 text-cyan-700 font-bold flex items-center gap-1.5">
            {node.type === "candidate" && <Shield size={12} className="text-cyan-500" />}
            {node.type === "company" && <Building size={12} className="text-blue-500" />}
            {node.type === "job" && <Briefcase size={12} className="text-emerald-500" />}
            {node.type === "skill" && <Code size={12} className="text-cyan-500" />}
            {node.type === "technology" && <Cpu size={12} className="text-purple-500" />}
            {node.type === "location" && <MapPin size={12} className="text-amber-500" />}
            {node.type === "domain" && <Layers size={12} className="text-emerald-500" />}
            {isJob ? "7D Match Inspector" : `${node.type} Entity`}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded dark:text-zinc-400 text-zinc-500 hover:dark:text-white hover:text-zinc-900 transition-colors"
            title="Close Inspector (Esc)"
          >
            <X size={14} />
          </button>
        </div>

        {/* Entity Title & Sublabel */}
        <div>
          <h3 className="text-sm font-bold dark:text-white text-zinc-900 leading-snug tracking-tight">
            {node.label}
          </h3>
          {node.sublabel && (
            <div className="text-xs dark:text-zinc-400 text-zinc-600 mt-0.5 font-medium">
              {node.sublabel}
            </div>
          )}
        </div>

        {/* 7-Dimensional Match Visualizer for Jobs (Section 75.3) */}
        {isJob && (
          <div className="space-y-3.5">
            {/* Score Hero Card */}
            <div className="rounded-xl border dark:border-emerald-500/30 border-emerald-300 dark:bg-emerald-950/30 bg-emerald-50/80 p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase dark:text-emerald-300 text-emerald-800 font-bold">
                  {score >= 85 ? "STRONG MATCH" : "POTENTIAL FIT"}
                </div>
                <div className="text-[10px] dark:text-zinc-400 text-zinc-600 mt-0.5">
                  Deterministic 7-D Synthesis
                </div>
              </div>
              <span className="text-2xl font-mono font-extrabold dark:text-emerald-400 text-emerald-700">
                {score}%
              </span>
            </div>

            {/* 7-Dimensional Progress Bar Breakdown */}
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-mono uppercase tracking-wider dark:text-zinc-400 text-zinc-500 font-semibold">
                Dimension Breakdown
              </div>
              {dimensions.map((dim: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[10px] dark:text-zinc-300 text-zinc-800 font-medium">
                      {dim.dimension}
                    </span>
                    <span className="text-[10px] dark:text-emerald-400 text-emerald-700 font-bold">
                      {dim.score}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full dark:bg-zinc-800 bg-zinc-200 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        dim.score >= 85
                          ? "bg-emerald-500"
                          : dim.score >= 70
                          ? "bg-cyan-500"
                          : "bg-amber-500"
                      )}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Why This Job */}
            {whyList.length > 0 && (
              <div className="rounded-lg border dark:border-emerald-500/20 border-emerald-200 dark:bg-emerald-950/15 bg-emerald-50/50 p-2.5 space-y-1.5">
                <div className="text-[10px] font-bold dark:text-emerald-400 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  WHY THIS JOB?
                </div>
                <ul className="space-y-1 font-mono text-[10px] dark:text-zinc-300 text-zinc-800">
                  {whyList.map((w: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {gapsList.length > 0 && (
              <div className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/40 bg-zinc-50 p-2.5 space-y-1.5">
                <div className="text-[10px] font-bold dark:text-rose-400 text-rose-700 flex items-center gap-1">
                  <XCircle size={11} />
                  GAPS
                </div>
                <ul className="space-y-1 font-mono text-[10px] dark:text-zinc-400 text-zinc-600">
                  {gapsList.map((g: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-rose-500 font-bold">−</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* General Meta for Non-Job Nodes */}
        {!isJob && node.meta && (
          <div className="mt-3 space-y-1.5 text-xs dark:text-zinc-400 text-zinc-600">
            {node.meta.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="text-amber-500" />
                <span>{node.meta.location}</span>
              </div>
            )}
            {node.meta.workMode && (
              <div className="font-mono text-[11px]">Mode: {node.meta.workMode}</div>
            )}
            {node.meta.salaryText && (
              <div className="dark:text-emerald-400 text-emerald-700 font-mono text-[11px] font-medium">
                {node.meta.salaryText}
              </div>
            )}
            {node.meta.domain && (
              <div className="text-zinc-500 text-[11px]">Domain: {node.meta.domain}</div>
            )}
          </div>
        )}

        {/* Direct Connections Count */}
        <div className="text-[10px] dark:text-zinc-500 text-zinc-400 font-mono border-t dark:border-zinc-800/80 border-zinc-200 pt-2">
          Direct Graph Connections: {connectionCount} entities
        </div>
      </div>

      {/* Footer Controls & Actions */}
      <div className="pt-3 border-t dark:border-zinc-800 border-zinc-200 space-y-2 mt-4">
        {node.type !== "candidate" && (
          <button
            onClick={() => onToggleExpand(node.id)}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border dark:border-zinc-700 border-zinc-300 dark:bg-zinc-800/80 bg-zinc-100 hover:dark:bg-zinc-700 hover:bg-zinc-200 py-1.5 text-xs dark:text-zinc-200 text-zinc-800 font-medium transition-colors shadow-xs"
          >
            {isExpanded ? (
              <>
                <MinusCircle size={13} className="text-zinc-500" />
                Collapse Connections
              </>
            ) : (
              <>
                <PlusCircle size={13} className="text-cyan-500" />
                Expand Connections
              </>
            )}
          </button>
        )}

        {node.meta?.applicationUrl && (
          <a
            href={node.meta.applicationUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-1.5 rounded-lg dark:bg-white bg-zinc-900 hover:dark:bg-zinc-200 hover:bg-zinc-800 dark:text-black text-white py-1.5 text-xs font-semibold transition-colors shadow-sm"
          >
            Apply on Company Portal
            <ExternalLink size={12} />
          </a>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-lg dark:bg-zinc-800 bg-zinc-100 hover:dark:bg-zinc-700 hover:bg-zinc-200 py-1.5 text-xs dark:text-zinc-300 text-zinc-700 font-medium transition-colors border dark:border-transparent border-zinc-200"
        >
          Close Inspector
        </button>
      </div>
    </aside>
  );
}
