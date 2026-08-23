import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineStep = {
  step: string;
  label: string;
  detail: string;
  status?: "pending" | "running" | "completed" | "failed";
  timestamp?: string;
};

export function RepairTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="relative pl-6 space-y-4">
      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 dark:bg-zinc-800 bg-zinc-200" />

      {steps.map((s, i) => {
        const isCompleted = s.status === "completed";
        const isRunning = s.status === "running";
        const isFailed = s.status === "failed";

        return (
          <div key={i} className="relative flex items-start gap-3">
            <div
              className={cn(
                "absolute -left-6 top-1 h-5 w-5 rounded-full flex items-center justify-center border text-[10px] font-mono transition-colors",
                isCompleted && "dark:bg-emerald-950 bg-emerald-100 dark:border-emerald-500/50 border-emerald-300 dark:text-emerald-400 text-emerald-700",
                isRunning && "dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-500 border-zinc-400 dark:text-white text-zinc-900 animate-pulse",
                isFailed && "dark:bg-rose-950 bg-rose-100 dark:border-rose-500/50 border-rose-300 dark:text-rose-400 text-rose-700",
                !isCompleted && !isRunning && !isFailed && "dark:bg-[#07080c] bg-white dark:border-zinc-800 border-zinc-300 dark:text-zinc-600 text-zinc-400"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 size={11} />
              ) : isFailed ? (
                <AlertCircle size={11} />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>

            <div className="flex-1 rounded-md border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950/60 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold dark:text-zinc-200 text-zinc-900">
                  {s.label || s.step}
                </div>
                <span
                  className={cn(
                    "text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-medium",
                    isCompleted && "dark:text-emerald-400 text-emerald-700 dark:bg-emerald-950/40 bg-emerald-100",
                    isRunning && "dark:text-white text-zinc-900 dark:bg-zinc-800 bg-zinc-200",
                    isFailed && "dark:text-rose-400 text-rose-700 dark:bg-rose-950/40 bg-rose-100",
                    !isCompleted && !isRunning && !isFailed && "dark:text-zinc-600 text-zinc-400 dark:bg-zinc-900 bg-zinc-100"
                  )}
                >
                  {s.status || "PENDING"}
                </span>
              </div>

              <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-1 leading-normal font-sans">{s.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
