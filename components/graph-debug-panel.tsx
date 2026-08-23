"use client";

import React from "react";
import { SimulationStats } from "@/lib/graph/physics-simulation";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function GraphDebugPanel({ stats }: { stats: SimulationStats | null }) {
  if (!stats) return null;

  const isRunning = stats.status === "RUNNING";

  return (
    <div className="absolute bottom-12 right-3 z-10 rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-black/85 bg-white/90 backdrop-blur-md px-3 py-2 text-[10px] font-mono dark:text-zinc-400 text-zinc-600 space-y-1 shadow-md pointer-events-none select-none transition-colors duration-150">
      <div className="flex items-center justify-between gap-3 font-semibold pb-1 border-b dark:border-zinc-800 border-zinc-200 dark:text-zinc-300 text-zinc-800">
        <span className="flex items-center gap-1.5 dark:text-cyan-400 text-cyan-700">
          <Zap size={11} />
          d3-force Physics
        </span>
        <span
          className={cn(
            "px-1.5 py-0.2 rounded font-bold uppercase text-[9px]",
            isRunning
              ? "dark:text-emerald-400 text-emerald-700 dark:bg-emerald-950/60 bg-emerald-100 border dark:border-emerald-500/30 border-emerald-300 animate-pulse"
              : "dark:text-zinc-500 text-zinc-500 dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-200"
          )}
        >
          {stats.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <div>
          Nodes: <span className="dark:text-zinc-200 text-zinc-900 font-semibold">{stats.nodeCount}</span>
        </div>
        <div>
          Edges: <span className="dark:text-zinc-200 text-zinc-900 font-semibold">{stats.edgeCount}</span>
        </div>
        <div>
          Alpha: <span className="dark:text-cyan-300 text-cyan-600 font-medium">{stats.alpha.toFixed(3)}</span>
        </div>
        <div>
          Velocity: <span className="dark:text-purple-300 text-purple-600 font-medium">{stats.averageVelocity.toFixed(3)}</span>
        </div>
        <div>
          FPS: <span className={cn("font-medium", stats.fps >= 55 ? "dark:text-emerald-400 text-emerald-600" : "dark:text-amber-400 text-amber-600")}>{stats.fps}</span>
        </div>
      </div>
    </div>
  );
}
