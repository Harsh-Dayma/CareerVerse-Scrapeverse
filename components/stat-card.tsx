import React from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  subtext?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  accent?: "cyan" | "emerald" | "violet" | "rose" | "amber";
};

export function StatCard({
  label,
  value,
  subtext,
  change,
  changeType = "neutral",
  icon,
  accent = "cyan",
}: StatCardProps) {
  const accentBorder = {
    cyan: "hover:border-cyan-500/30",
    emerald: "hover:border-emerald-500/30",
    violet: "hover:border-violet-500/30",
    rose: "hover:border-rose-500/30",
    amber: "hover:border-amber-500/30",
  }[accent];

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md transition-all duration-200",
        accentBorder
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        {icon && <div className="text-zinc-400">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-3xl font-bold tracking-tight text-white font-mono-numeric">
          {value}
        </div>
        {change && (
          <span
            className={cn(
              "text-xs font-medium font-mono",
              changeType === "positive" && "text-emerald-400",
              changeType === "negative" && "text-rose-400",
              changeType === "neutral" && "text-zinc-400"
            )}
          >
            {change}
          </span>
        )}
      </div>

      {subtext && <div className="mt-1 text-xs text-zinc-500">{subtext}</div>}
    </div>
  );
}
