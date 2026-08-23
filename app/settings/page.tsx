"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { useTheme, Theme } from "@/components/theme-provider";
import { CheckCircle2, Sun, Moon, Laptop, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [weights, setWeights] = useState({
    skills: 25,
    technologies: 20,
    role: 15,
    experience: 15,
    location: 10,
    workMode: 10,
    domain: 5,
  });
  const [saved, setSaved] = useState(false);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans transition-colors duration-150">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto overflow-y-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800 border-zinc-200 pb-5">
          <div>
            <h1 className="text-xl font-bold dark:text-white text-zinc-900 tracking-tight">Settings</h1>
            <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-0.5 font-mono">
              Appearance, scoring dimension weights, and runtime parameters
            </p>
          </div>

          {saved && (
            <div className="flex items-center gap-1.5 text-xs font-mono dark:text-emerald-400 text-emerald-700 dark:bg-emerald-950/50 bg-emerald-100 border dark:border-emerald-500/30 border-emerald-300 px-3 py-1 rounded">
              <CheckCircle2 size={13} />
              Settings Saved
            </div>
          )}
        </div>

        {/* Appearance & Theme (Section 67) */}
        <div className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/30 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b dark:border-zinc-800 border-zinc-200 text-xs">
            <Palette size={14} className="dark:text-cyan-400 text-cyan-600" />
            <span className="font-bold dark:text-white text-zinc-900 font-mono uppercase tracking-wider">
              Appearance & Theme
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "rounded-lg border p-4 text-left flex items-start gap-3 transition-all cursor-pointer",
                theme === "dark"
                  ? "dark:border-cyan-400 border-cyan-600 dark:bg-cyan-950/20 bg-cyan-50 ring-2 dark:ring-cyan-500/30 ring-cyan-500/20"
                  : "dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950/50 bg-zinc-50 hover:dark:border-zinc-700 hover:border-zinc-300"
              )}
            >
              <Moon size={18} className="dark:text-cyan-400 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold dark:text-white text-zinc-900">Dark Mode</div>
                <div className="text-[11px] dark:text-zinc-400 text-zinc-600 mt-0.5">
                  Deep neutral theme optimized for low-glare focus
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn(
                "rounded-lg border p-4 text-left flex items-start gap-3 transition-all cursor-pointer",
                theme === "light"
                  ? "dark:border-cyan-400 border-cyan-600 dark:bg-cyan-950/20 bg-cyan-50 ring-2 dark:ring-cyan-500/30 ring-cyan-500/20"
                  : "dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950/50 bg-zinc-50 hover:dark:border-zinc-700 hover:border-zinc-300"
              )}
            >
              <Sun size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold dark:text-white text-zinc-900">Light Mode</div>
                <div className="text-[11px] dark:text-zinc-400 text-zinc-600 mt-0.5">
                  Crisp, high-contrast light theme with soft slate accents
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme("system")}
              className={cn(
                "rounded-lg border p-4 text-left flex items-start gap-3 transition-all cursor-pointer",
                theme === "system"
                  ? "dark:border-cyan-400 border-cyan-600 dark:bg-cyan-950/20 bg-cyan-50 ring-2 dark:ring-cyan-500/30 ring-cyan-500/20"
                  : "dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950/50 bg-zinc-50 hover:dark:border-zinc-700 hover:border-zinc-300"
              )}
            >
              <Laptop size={18} className="dark:text-purple-400 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold dark:text-white text-zinc-900">System Sync</div>
                <div className="text-[11px] dark:text-zinc-400 text-zinc-600 mt-0.5">
                  Automatically match your device OS color scheme
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 7-Dimension Matching Weights (Section 53) */}
        <div className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/30 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b dark:border-zinc-800 border-zinc-200 text-xs">
            <span className="font-bold dark:text-white text-zinc-900 font-mono uppercase tracking-wider">
              7-Dimension Matching Weights
            </span>
            <span className="font-mono dark:text-zinc-400 text-zinc-600">
              Total: <span className="font-semibold dark:text-white text-zinc-900">{totalWeight}%</span>
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(weights).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize dark:text-zinc-300 text-zinc-700 font-medium">
                    {key === "workMode" ? "Work Mode (Remote/Hybrid)" : key}
                  </span>
                  <span className="font-mono dark:text-zinc-300 text-zinc-900 font-semibold">{val}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={val}
                  onChange={(e) =>
                    setWeights({ ...weights, [key]: Number(e.target.value) })
                  }
                  className="w-full h-1.5 dark:bg-zinc-800 bg-zinc-200 rounded appearance-none cursor-pointer accent-cyan-600"
                />
              </div>
            ))}
          </div>

          <div className="border-t dark:border-zinc-800 border-zinc-200 pt-4 flex justify-end">
            <button
              onClick={handleSave}
              className="rounded dark:bg-white bg-zinc-900 dark:hover:bg-zinc-200 hover:bg-zinc-800 dark:text-black text-white px-4 py-1.5 text-xs font-semibold transition-colors shadow-xs"
            >
              Save Weights
            </button>
          </div>
        </div>

        {/* Integration Credentials Info */}
        <div className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/30 bg-white p-5 space-y-3 shadow-xs">
          <h2 className="text-sm font-bold dark:text-white text-zinc-900 font-mono uppercase tracking-wider">
            Environment & Runtime
          </h2>

          <div className="space-y-2 text-xs font-mono">
            <div className="rounded border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-zinc-50 p-2.5 flex items-center justify-between">
              <span className="dark:text-zinc-400 text-zinc-600">DATABASE_URL</span>
              <span className="dark:text-zinc-500 text-zinc-500 font-medium">PostgreSQL / PGlite Universal Driver</span>
            </div>

            <div className="rounded border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-zinc-50 p-2.5 flex items-center justify-between">
              <span className="dark:text-zinc-400 text-zinc-600">BRIGHT_DATA_API_TOKEN</span>
              <span className="dark:text-zinc-500 text-zinc-500 font-medium">Auto-detected (Mock / Live Studio)</span>
            </div>

            <div className="rounded border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-zinc-50 p-2.5 flex items-center justify-between">
              <span className="dark:text-zinc-400 text-zinc-600">CRON_SECRET</span>
              <span className="dark:text-zinc-500 text-zinc-500 font-medium">Vercel Serverless Scans</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
