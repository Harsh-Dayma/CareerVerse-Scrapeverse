"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Share2,
  PlayCircle,
  ShieldCheck,
  Building,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CareerPulseProps {
  metrics: {
    totalJobs?: number;
    matchingJobs?: number;
    companiesMonitored?: number;
    healthyScrapers?: number;
    averageMatchScore?: number;
    topMatchScore?: number;
  } | null;
}

export function CareerPulse({ metrics }: CareerPulseProps) {
  const topScore = metrics?.topMatchScore ?? 94;
  const avgScore = metrics?.averageMatchScore ?? 81;
  const totalJobs = metrics?.totalJobs ?? 24;
  const matchingJobs = metrics?.matchingJobs ?? 7;
  const monitoredCompanies = metrics?.companiesMonitored ?? 5;
  const healthyScrapers = metrics?.healthyScrapers ?? 5;

  return (
    <div className="relative rounded-2xl border dark:border-zinc-800 border-zinc-200/90 dark:bg-gradient-to-b dark:from-[#0f141f] dark:to-[#090c12] bg-gradient-to-b from-white to-slate-50 p-6 md:p-8 shadow-sm overflow-hidden select-none transition-colors duration-150">
      {/* Subtle Background Geometry */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full dark:bg-cyan-500/5 bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full dark:bg-purple-500/5 bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left Side: Headline & Live Pulse Narrative */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest dark:text-cyan-400 text-cyan-700 dark:bg-cyan-950/60 bg-cyan-100 dark:border-cyan-500/30 border-cyan-300 border px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-ping" />
              Live Career Intelligence Radar
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-zinc-900 tracking-tight leading-tight">
            Your career, <span className="dark:text-cyan-400 text-cyan-600">continuously monitored</span> and matched.
          </h2>

          <p className="text-xs sm:text-sm dark:text-zinc-400 text-zinc-600 leading-relaxed font-sans">
            CareerVerse scans target company portals, self-heals broken scrapers in real time, and evaluates opportunities across 7 deterministic dimensions.
          </p>

          {/* Quick CTAs */}
          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <Link
              href="/graph"
              className="rounded-lg dark:bg-white bg-zinc-900 hover:dark:bg-zinc-200 hover:bg-zinc-800 dark:text-black text-white px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Share2 size={13} className="text-cyan-600 dark:text-cyan-700" />
              Explore Career Network
              <ArrowUpRight size={13} />
            </Link>

            <Link
              href="/demo"
              className="rounded-lg border dark:border-zinc-700 border-zinc-300 dark:bg-zinc-900/90 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 px-4 py-2 text-xs font-semibold dark:text-zinc-200 text-zinc-800 transition-all flex items-center gap-2 shadow-xs"
            >
              <PlayCircle size={13} className="text-purple-500" />
              Run Self-Healing Demo
            </Link>
          </div>
        </div>

        {/* Right Side: Analytical Career Fit Instrument (Section 74.4) */}
        <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl dark:bg-black/40 bg-slate-100/70 border dark:border-zinc-800/80 border-zinc-200 p-5 shadow-inner shrink-0">
          {/* Fit Gauge */}
          <div className="flex flex-col items-center justify-center text-center px-4">
            <div className="relative flex items-center justify-center h-24 w-24 rounded-full dark:bg-emerald-950/40 bg-emerald-100 border-2 dark:border-emerald-500/40 border-emerald-400 shadow-sm">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-mono font-extrabold dark:text-emerald-400 text-emerald-700 leading-none">
                  {topScore}%
                </span>
                <span className="text-[8px] font-mono uppercase tracking-wider dark:text-emerald-300/80 text-emerald-800 mt-1 font-bold">
                  Top Fit
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono dark:text-zinc-400 text-zinc-600 mt-2 font-semibold">
              Avg Market Fit: {avgScore}%
            </span>
          </div>

          {/* Key Signal Pillars */}
          <div className="grid grid-cols-2 gap-3 min-w-[200px] border-t sm:border-t-0 sm:border-l dark:border-zinc-800/80 border-zinc-200/90 pt-4 sm:pt-0 sm:pl-5">
            <div>
              <div className="text-[10px] font-mono uppercase dark:text-zinc-500 text-zinc-500 flex items-center gap-1">
                <Target size={11} className="text-cyan-500" /> Opportunities
              </div>
              <div className="text-lg font-mono font-bold dark:text-white text-zinc-900 mt-0.5">
                {totalJobs}
              </div>
              <div className="text-[9px] dark:text-zinc-500 text-zinc-500 font-mono">
                {matchingJobs} strong matches
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase dark:text-zinc-500 text-zinc-500 flex items-center gap-1">
                <Building size={11} className="text-blue-500" /> Monitored
              </div>
              <div className="text-lg font-mono font-bold dark:text-white text-zinc-900 mt-0.5">
                {monitoredCompanies}
              </div>
              <div className="text-[9px] dark:text-zinc-500 text-zinc-500 font-mono">
                Target portals
              </div>
            </div>

            <div className="col-span-2 pt-1 border-t dark:border-zinc-800/60 border-zinc-200">
              <div className="text-[10px] font-mono uppercase dark:text-zinc-500 text-zinc-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-500" /> Scraper Health
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {healthyScrapers}/{monitoredCompanies} Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
