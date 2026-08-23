"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { RepairTimeline } from "@/components/repair-timeline";
import { SelfHealingEvidencePanel } from "@/components/evidence-panel";
import {
  Play,
  SkipForward,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Share2,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DemoPage() {
  const [demoState, setDemoState] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  function loadState() {
    setLoading(true);
    fetch("/api/demo")
      .then((res) => res.json())
      .then((data) => setDemoState(data))
      .catch((err) => console.error("Failed to load demo state:", err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadState();
  }, []);

  async function handleNextStep() {
    setRunning(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "next" }),
      });
      const data = await res.json();
      if (data.state) {
        setDemoState(data.state);
      }
    } finally {
      setRunning(false);
    }
  }

  async function handleFullDemo() {
    setRunning(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      const data = await res.json();
      if (data.state) {
        setDemoState(data.state);
      }
    } finally {
      setRunning(false);
    }
  }

  async function handleReset() {
    setRunning(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (data.state) {
        setDemoState(data.state);
      }
    } finally {
      setRunning(false);
    }
  }

  const isCompleted = demoState?.state === "RECOVERED" || demoState?.currentStep === 5;
  const isDegraded = demoState?.state === "DEGRADED";

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans transition-colors duration-150">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto overflow-y-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800/80 border-zinc-200/90 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold dark:text-white text-zinc-900 tracking-tight">
                Self-Healing Scraper & Radar Showcase
              </h1>
              <span className="text-[10px] font-mono dark:bg-purple-950/60 bg-purple-100 dark:text-purple-400 text-purple-800 border dark:border-purple-500/30 border-purple-300 border px-2.5 py-0.5 rounded-full font-bold">
                Deterministic Simulator
              </span>
            </div>
            <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-1 font-mono">
              Live sequence demonstrating DOM drift detection, automated schema repair, and knowledge graph sync
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Action Button (Section 74.28) */}
            <button
              onClick={handleFullDemo}
              disabled={running}
              className="flex items-center gap-2 rounded-lg dark:bg-white bg-zinc-900 hover:dark:bg-zinc-200 hover:bg-zinc-800 dark:text-black text-white px-4 py-2 text-xs font-bold disabled:opacity-50 transition-all shadow-sm"
            >
              <Play size={13} className="fill-current" />
              {running ? "Executing Recovery..." : "Run Full Demo"}
            </button>

            <button
              onClick={handleNextStep}
              disabled={running}
              className="flex items-center gap-1.5 rounded-lg border dark:border-zinc-700 border-zinc-300 dark:bg-zinc-800 bg-zinc-100 hover:dark:bg-zinc-700 hover:bg-zinc-200 px-3.5 py-2 text-xs dark:text-zinc-200 text-zinc-800 font-medium disabled:opacity-50 transition-colors shadow-xs"
            >
              <SkipForward size={13} />
              Step Forward
            </button>

            <button
              onClick={handleReset}
              disabled={running}
              className="flex items-center gap-1.5 rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 p-2 dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-zinc-900 disabled:opacity-50 transition-colors shadow-xs"
              title="Reset Simulator"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Demo Climax Showcase Banner (Section 74.29) */}
        {isCompleted && (
          <div className="rounded-2xl border dark:border-emerald-500/30 border-emerald-300 dark:bg-emerald-950/20 bg-emerald-50/80 p-6 space-y-4 shadow-sm animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-sm font-mono font-bold dark:text-emerald-400 text-emerald-800 uppercase tracking-wider">
                    Self-Healing Sequence Complete
                  </span>
                </div>
                <p className="text-xs dark:text-zinc-300 text-zinc-700 font-sans">
                  The collector detected career page schema drift, repaired extraction selectors, verified payloads, and synced new opportunities to the knowledge graph.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/graph"
                  className="rounded-lg dark:bg-white bg-zinc-900 hover:dark:bg-zinc-200 hover:bg-zinc-800 dark:text-black text-white px-3.5 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Share2 size={13} />
                  View in Graph
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-lg border dark:border-emerald-500/30 border-emerald-300 dark:bg-emerald-950/50 bg-white hover:bg-emerald-100 px-3.5 py-2 text-xs font-semibold dark:text-emerald-300 text-emerald-800 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Briefcase size={13} />
                  Inspect Matches
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t dark:border-emerald-500/20 border-emerald-200 text-xs font-mono">
              <div className="p-2.5 rounded-lg dark:bg-emerald-950/40 bg-white/80 border dark:border-emerald-500/20 border-emerald-200">
                <div className="text-[10px] text-zinc-500 uppercase">Opportunities Discovered</div>
                <div className="text-lg font-bold dark:text-emerald-400 text-emerald-700 mt-0.5">
                  +7 New Jobs
                </div>
              </div>
              <div className="p-2.5 rounded-lg dark:bg-emerald-950/40 bg-white/80 border dark:border-emerald-500/20 border-emerald-200">
                <div className="text-[10px] text-zinc-500 uppercase">Top Match Score</div>
                <div className="text-lg font-bold dark:text-emerald-400 text-emerald-700 mt-0.5">
                  94% Match
                </div>
              </div>
              <div className="p-2.5 rounded-lg dark:bg-emerald-950/40 bg-white/80 border dark:border-emerald-500/20 border-emerald-200">
                <div className="text-[10px] text-zinc-500 uppercase">Schema Verification</div>
                <div className="text-lg font-bold dark:text-emerald-400 text-emerald-700 mt-0.5">
                  98% Accuracy
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State Machine Telemetry HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs dark:bg-zinc-900/40 bg-white border dark:border-zinc-800/80 border-zinc-200/90 rounded-xl p-4 shadow-xs">
          <div>
            <div className="text-[10px] dark:text-zinc-500 text-zinc-500 uppercase">Simulation Phase</div>
            <div className="text-sm font-bold dark:text-white text-zinc-900 mt-0.5">
              Step {demoState?.currentStep ?? "1"} / 5
            </div>
          </div>

          <div>
            <div className="text-[10px] dark:text-zinc-500 text-zinc-500 uppercase">Target Career Portal</div>
            <div className="text-sm font-bold dark:text-zinc-200 text-zinc-900 truncate mt-0.5">
              {demoState?.companyName ?? "Nova Labs"}
            </div>
          </div>

          <div>
            <div className="text-[10px] dark:text-zinc-500 text-zinc-500 uppercase">Pipeline State</div>
            <div
              className={cn(
                "text-sm font-bold mt-0.5 uppercase",
                isCompleted
                  ? "dark:text-emerald-400 text-emerald-600"
                  : isDegraded
                  ? "dark:text-rose-400 text-rose-600 animate-pulse"
                  : "dark:text-cyan-400 text-cyan-600"
              )}
            >
              {demoState?.state ?? "HEALTHY"}
            </div>
          </div>

          <div>
            <div className="text-[10px] dark:text-zinc-500 text-zinc-500 uppercase">Extraction Accuracy</div>
            <div className="text-sm font-bold dark:text-emerald-400 text-emerald-600 mt-0.5">
              {demoState?.accuracy ?? 94}%
            </div>
          </div>
        </div>

        {/* Dynamic Repair Timeline */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold dark:text-white text-zinc-900 font-mono uppercase tracking-wider">
            Self-Healing State Progression
          </h2>

          <div className="rounded-xl border dark:border-zinc-800/80 border-zinc-200/90 dark:bg-zinc-900/30 bg-white p-5 shadow-xs">
            <RepairTimeline steps={demoState?.steps || []} />
          </div>
        </div>

        {/* Evidence Verification Audit Panel (Section 74.12) */}
        <SelfHealingEvidencePanel />
      </main>
    </div>
  );
}
