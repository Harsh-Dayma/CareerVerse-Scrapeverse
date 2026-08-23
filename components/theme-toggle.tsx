"use client";

import React from "react";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/80 bg-zinc-100 p-0.5 text-xs font-mono select-none",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md transition-all",
          theme === "light"
            ? "bg-white text-zinc-900 font-semibold shadow-xs"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        )}
        title="Light Theme"
      >
        <Sun size={12} className={theme === "light" ? "text-amber-500" : ""} />
        <span className="text-[10px]">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md transition-all",
          theme === "dark"
            ? "bg-zinc-800 text-white font-semibold shadow-xs"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        )}
        title="Dark Theme"
      >
        <Moon size={12} className={theme === "dark" ? "text-cyan-400" : ""} />
        <span className="text-[10px]">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md transition-all",
          theme === "system"
            ? "dark:bg-zinc-800 bg-white dark:text-white text-zinc-900 font-semibold shadow-xs"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        )}
        title="System Preference"
      >
        <Laptop size={12} />
        <span className="text-[10px]">Auto</span>
      </button>
    </div>
  );
}
