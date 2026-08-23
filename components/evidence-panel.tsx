"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type HealingEventData = {
  id: number;
  scraperId: number;
  scraperName: string;
  collectorId: string;
  companyName: string;
  careersUrl: string;
  failureType: string;
  errorReason: string;
  state: "DETECTED" | "HEALING_REQUESTED" | "HEALING_IN_PROGRESS" | "VALIDATING" | "RECOVERED" | "FAILED";
  beforeSample: Record<string, any> | null;
  afterSample: Record<string, any> | null;
  structuralDiff: {
    field: string;
    expected: string;
    observed: string;
  }[];
  validationScore: number;
  recoveryTimeMs?: number;
  resolution?: string;
  metadata?: Record<string, any>;
  createdAt: string;
};

export function SelfHealingEvidencePanel() {
  const [events, setEvents] = useState<HealingEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  function loadEvidence() {
    setLoading(true);
    fetch("/api/scrapers/evidence")
      .then((res) => res.json())
      .then((data) => {
        const safeArray = Array.isArray(data) ? data : [];
        setEvents(safeArray);
        if (safeArray.length > 0) {
          setSelectedEventId(safeArray[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load evidence:", err);
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadEvidence();
  }, []);

  const safeEvents = Array.isArray(events) ? events : [];
  const activeEvent = safeEvents.find((e) => e.id === selectedEventId) || safeEvents[0];

  const structuralDiffs = activeEvent?.structuralDiff
    ? Array.isArray(activeEvent.structuralDiff)
      ? activeEvent.structuralDiff
      : typeof activeEvent.structuralDiff === "string"
      ? (() => {
          try {
            return JSON.parse(activeEvent.structuralDiff);
          } catch {
            return [];
          }
        })()
      : []
    : [];

  const beforeSampleObj = activeEvent?.beforeSample
    ? typeof activeEvent.beforeSample === "string"
      ? (() => {
          try {
            return JSON.parse(activeEvent.beforeSample);
          } catch {
            return {};
          }
        })()
      : activeEvent.beforeSample
    : {};

  const afterSampleObj = activeEvent?.afterSample
    ? typeof activeEvent.afterSample === "string"
      ? (() => {
          try {
            return JSON.parse(activeEvent.afterSample);
          } catch {
            return {};
          }
        })()
      : activeEvent.afterSample
    : {};

  return (
    <div className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/30 bg-white p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b dark:border-zinc-800 border-zinc-200 pb-3">
        <div>
          <h2 className="text-sm font-bold dark:text-white text-zinc-900 font-mono uppercase tracking-wider">
            Self-Healing Verification Evidence
          </h2>
          <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-0.5">
            Audit log of detected DOM drift, selector recovery, and payload verification.
          </p>
        </div>

        <button
          onClick={loadEvidence}
          disabled={loading}
          className="flex items-center gap-1 rounded border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/90 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 px-2.5 py-1 text-xs dark:text-zinc-300 text-zinc-700 transition-colors shadow-xs"
        >
          <RefreshCw size={11} className={cn(loading && "animate-spin")} />
          Refresh Evidence
        </button>
      </div>

      {loading && safeEvents.length === 0 && (
        <div className="py-8 text-center text-xs dark:text-zinc-500 text-zinc-400 font-mono">
          Loading evidence records...
        </div>
      )}

      {!loading && safeEvents.length === 0 && (
        <div className="py-8 text-center text-xs dark:text-zinc-500 text-zinc-500 font-mono">
          No degradation events recorded. Trigger a scrape to generate telemetry.
        </div>
      )}

      {activeEvent && (
        <div className="space-y-4 text-xs">
          {/* Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 dark:bg-zinc-950 bg-zinc-50 p-3 rounded-lg border dark:border-zinc-800/80 border-zinc-200 font-mono">
            <div>
              <div className="text-[10px] dark:text-zinc-500 text-zinc-500 uppercase">Target</div>
              <div className="dark:text-zinc-200 text-zinc-900 font-semibold truncate mt-0.5">{activeEvent.companyName}</div>
            </div>
            <div>
              <div className="text-[10px] dark:text-zinc-500 text-zinc-500 uppercase">Collector</div>
              <div className="dark:text-zinc-400 text-zinc-600 font-mono mt-0.5">{activeEvent.collectorId}</div>
            </div>
            <div>
              <div className="text-[10px] dark:text-zinc-500 text-zinc-500 uppercase">Status</div>
              <div className="dark:text-emerald-400 text-emerald-700 font-semibold mt-0.5">
                ● {activeEvent.state} ({activeEvent.validationScore}%)
              </div>
            </div>
            <div>
              <div className="text-[10px] dark:text-zinc-500 text-zinc-500 uppercase">Recovery Duration</div>
              <div className="dark:text-zinc-300 text-zinc-700 font-medium mt-0.5">
                {activeEvent.recoveryTimeMs ? `${activeEvent.recoveryTimeMs}ms` : "Automated"}
              </div>
            </div>
          </div>

          {/* Factual Diagnosis */}
          <div className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-zinc-50 p-3 text-xs">
            <div className="font-semibold dark:text-amber-400 text-amber-700 font-mono">
              Drift Anomaly: {activeEvent.failureType}
            </div>
            <div className="dark:text-zinc-400 text-zinc-600 mt-1">{activeEvent.errorReason}</div>
            {activeEvent.resolution && (
              <div className="mt-2 dark:text-emerald-400 text-emerald-700 border-t dark:border-zinc-800/60 border-zinc-200 pt-1.5 font-mono text-[11px]">
                Resolution: {activeEvent.resolution}
              </div>
            )}
          </div>

          {/* Side-by-Side Payload Diffs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-zinc-50 p-3">
              <div className="flex items-center justify-between pb-1.5 border-b dark:border-zinc-800/80 border-zinc-200 font-mono text-[10px]">
                <span className="dark:text-zinc-400 text-zinc-600 font-semibold uppercase">Baseline Extraction</span>
                <span className="dark:text-emerald-400 text-emerald-700 font-medium">Valid</span>
              </div>
              <pre className="mt-2 text-[11px] font-mono dark:text-zinc-300 text-zinc-800 overflow-x-auto">
                {JSON.stringify(beforeSampleObj, null, 2)}
              </pre>
            </div>

            <div className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-zinc-50 p-3">
              <div className="flex items-center justify-between pb-1.5 border-b dark:border-zinc-800/80 border-zinc-200 font-mono text-[10px]">
                <span className="dark:text-zinc-400 text-zinc-600 font-semibold uppercase">Observed Drift / Recovered</span>
                <span className="dark:text-purple-400 text-purple-700 font-medium">Self-Healed</span>
              </div>
              <pre className="mt-2 text-[11px] font-mono dark:text-zinc-300 text-zinc-800 overflow-x-auto">
                {JSON.stringify(afterSampleObj, null, 2)}
              </pre>
            </div>
          </div>

          {/* Field Extraction Variance Table */}
          {structuralDiffs.length > 0 && (
            <div className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-zinc-50 p-3 space-y-2">
              <div className="text-[10px] font-mono uppercase dark:text-zinc-500 text-zinc-500 font-semibold">
                Field-Level Extraction Variance
              </div>
              <div className="space-y-1.5">
                {structuralDiffs.map((diff: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between font-mono text-[11px] dark:text-zinc-300 text-zinc-800 py-1 border-b dark:border-zinc-800/40 border-zinc-200 last:border-0"
                  >
                    <span className="dark:text-zinc-400 text-zinc-600">{diff.field}</span>
                    <div className="flex items-center gap-2">
                      <span className="dark:text-emerald-400 text-emerald-700">{diff.expected}</span>
                      <ArrowRight size={11} className="dark:text-zinc-600 text-zinc-400" />
                      <span className="dark:text-rose-400 text-rose-700">{diff.observed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
