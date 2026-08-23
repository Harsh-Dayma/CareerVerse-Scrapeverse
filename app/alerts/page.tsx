"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { RefreshCw, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = useCallback(() => {
    setLoading(true);
    fetch("/api/alerts")
      .then((res) => res.json())
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  async function handleDismiss(id: number) {
    try {
      await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Dismiss alert failed:", err);
    }
  }

  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans transition-colors duration-150">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800 border-zinc-200 pb-5">
          <div>
            <h1 className="text-xl font-bold dark:text-white text-zinc-900 tracking-tight">Notification Center</h1>
            <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-0.5 font-mono">
              Real-time feed of new matches, deadline updates, and scraper events
            </p>
          </div>

          <button
            onClick={loadAlerts}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/80 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 px-3 py-1.5 text-xs dark:text-zinc-300 text-zinc-700 transition-colors shadow-xs"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Clean Notifications List (Section 51) */}
        <div className="rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/30 bg-white divide-y dark:divide-zinc-800/60 divide-zinc-100 overflow-hidden shadow-xs">
          {loading && safeAlerts.length === 0 && (
            <div className="py-12 text-center text-xs dark:text-zinc-500 text-zinc-400 font-mono">
              Loading notifications...
            </div>
          )}

          {!loading && safeAlerts.length === 0 && (
            <div className="py-12 text-center text-xs dark:text-zinc-500 text-zinc-500 font-mono">
              No active alerts. Everything is running normally.
            </div>
          )}

          {safeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 flex items-start justify-between gap-4 hover:dark:bg-zinc-800/30 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.severity === "WARNING" ? (
                    <AlertTriangle size={15} className="dark:text-amber-400 text-amber-600" />
                  ) : alert.severity === "CRITICAL" ? (
                    <AlertTriangle size={15} className="dark:text-rose-400 text-rose-600" />
                  ) : (
                    <Info size={15} className="dark:text-cyan-400 text-cyan-600" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold dark:text-white text-zinc-900">{alert.title}</span>
                    <span className="text-[10px] font-mono dark:text-zinc-500 text-zinc-500 uppercase px-1.5 py-0.2 dark:bg-zinc-800 bg-zinc-100 rounded">
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-xs dark:text-zinc-400 text-zinc-600 leading-relaxed">{alert.message}</p>
                  <div className="text-[10px] font-mono dark:text-zinc-500 text-zinc-500 mt-1">
                    {new Date(alert.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDismiss(alert.id)}
                className="text-[11px] font-mono dark:text-zinc-500 text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-800 px-2 py-1 rounded hover:dark:bg-zinc-800 hover:bg-zinc-100 transition-colors shrink-0"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
