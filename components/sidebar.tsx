"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Share2,
  Activity,
  History,
  Bell,
  User,
  PlayCircle,
  Settings,
  Zap,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/command-palette";

const mainLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, badge: null, shortcut: "D" },
  { href: "/jobs", label: "Opportunities", icon: Briefcase, badge: "Matches", shortcut: "J" },
  { href: "/graph", label: "Knowledge Graph", icon: Share2, badge: "Physics", shortcut: "G" },
  { href: "/scrapers", label: "Scraper Radar", icon: Activity, badge: null, shortcut: "S" },
  { href: "/timeline", label: "Temporal History", icon: History, badge: null, shortcut: "T" },
  { href: "/alerts", label: "Notifications", icon: Bell, badge: null, shortcut: null },
  { href: "/demo", label: "Self-Healing Demo", icon: PlayCircle, badge: "Live", shortcut: null },
];

const secondaryLinks = [
  { href: "/profile", label: "Candidate Profile", icon: User, shortcut: "P" },
  { href: "/settings", label: "Settings", icon: Settings, shortcut: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global Keyboard Shortcuts (Section 74.21 & 74.23)
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if typing inside input, textarea, or select
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea" || activeTag === "select";

      // ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      if (isInput || paletteOpen) return;

      // Single-key quick navigation
      if (e.key === "d" || e.key === "D") {
        router.push("/dashboard");
      } else if (e.key === "j" || e.key === "J") {
        router.push("/jobs");
      } else if (e.key === "g" || e.key === "G") {
        router.push("/graph");
      } else if (e.key === "s" || e.key === "S") {
        router.push("/scrapers");
      } else if (e.key === "t" || e.key === "T") {
        router.push("/timeline");
      } else if (e.key === "p" || e.key === "P") {
        router.push("/profile");
      }
    },
    [paletteOpen, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return (
    <>
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <aside className="w-64 shrink-0 border-r dark:border-zinc-800/80 border-zinc-200/90 dark:bg-[#080a0f] bg-white p-4 hidden lg:flex flex-col justify-between min-h-screen select-none transition-colors duration-150 z-30">
        <div>
          {/* Brand Lockup (Section 73.3 & 73.4) */}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2.5 py-2 mb-4 group">
            <div className="h-7 w-7 rounded-lg dark:bg-cyan-500/10 bg-cyan-100 border dark:border-cyan-500/30 border-cyan-300 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
              <Zap size={14} className="fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold tracking-tight dark:text-white text-zinc-900 leading-none">
                CAREER<span className="dark:text-cyan-400 text-cyan-600">VERSE</span>
              </span>
              <span className="text-[9px] font-mono dark:text-zinc-500 text-zinc-400 mt-0.5 tracking-wider uppercase">
                Radar & Match Engine
              </span>
            </div>
          </Link>

          {/* Omnisearch Trigger Button (Section 74.21) */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="w-full mb-5 flex items-center justify-between rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/80 bg-zinc-100/80 px-3 py-1.5 text-xs dark:text-zinc-400 text-zinc-600 hover:dark:bg-zinc-800 hover:bg-zinc-200/60 transition-colors shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <Search size={13} className="text-zinc-400 group-hover:text-cyan-500 transition-colors" />
              <span className="text-[11px] font-medium">Quick Jump...</span>
            </div>
            <kbd className="rounded dark:bg-zinc-800 bg-white px-1.5 py-0.5 text-[9px] font-mono dark:text-zinc-400 text-zinc-500 border dark:border-zinc-700 border-zinc-300">
              ⌘K
            </kbd>
          </button>

          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider dark:text-zinc-500 text-zinc-400 font-semibold">
              Intelligence
            </div>
            <nav className="flex flex-col gap-0.5">
              {mainLinks.map(({ href, label, icon: Icon, badge, shortcut }) => {
                const active = pathname === href;

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all group",
                      active
                        ? "dark:bg-zinc-800/90 bg-zinc-100 dark:text-white text-zinc-900 font-semibold shadow-xs"
                        : "dark:text-zinc-400 text-zinc-600 hover:dark:bg-zinc-800/50 hover:bg-zinc-50 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={15}
                        className={cn(
                          "transition-colors",
                          active
                            ? "dark:text-cyan-400 text-cyan-600"
                            : "dark:text-zinc-500 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                        )}
                      />
                      <span>{label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {badge && (
                        <span
                          className={cn(
                            "text-[9px] font-mono px-1.5 py-0.2 rounded font-medium",
                            active
                              ? "dark:bg-cyan-950/80 bg-cyan-100 dark:text-cyan-300 text-cyan-800 border dark:border-cyan-500/30 border-cyan-200"
                              : "dark:bg-zinc-900 bg-zinc-100 dark:text-zinc-500 text-zinc-500"
                          )}
                        >
                          {badge}
                        </span>
                      )}
                      {shortcut && !active && (
                        <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {shortcut}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="my-5 border-t dark:border-zinc-800/80 border-zinc-200/80 mx-2" />

          {/* Configuration Navigation */}
          <div className="space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider dark:text-zinc-500 text-zinc-400 font-semibold">
              System
            </div>
            <nav className="flex flex-col gap-0.5">
              {secondaryLinks.map(({ href, label, icon: Icon, shortcut }) => {
                const active = pathname === href;

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all group",
                      active
                        ? "dark:bg-zinc-800/90 bg-zinc-100 dark:text-white text-zinc-900 font-semibold shadow-xs"
                        : "dark:text-zinc-400 text-zinc-600 hover:dark:bg-zinc-800/50 hover:bg-zinc-50 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={15}
                        className={cn(
                          "transition-colors",
                          active
                            ? "dark:text-cyan-400 text-cyan-600"
                            : "dark:text-zinc-500 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                        )}
                      />
                      <span>{label}</span>
                    </div>
                    {shortcut && !active && (
                      <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {shortcut}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Controls: Theme Switcher & Engine Pulse */}
        <div className="border-t dark:border-zinc-800/80 border-zinc-200/80 pt-3 px-2 space-y-3">
          <div>
            <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mb-1.5 px-0.5 uppercase tracking-wider">
              Theme
            </div>
            <ThemeToggle className="w-full justify-between" />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono dark:text-zinc-500 text-zinc-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Deterministic Engine
            </span>
            <span className="dark:text-zinc-400 text-zinc-600 font-medium">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
