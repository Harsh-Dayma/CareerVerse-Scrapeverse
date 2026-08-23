"use client";

import { Sidebar } from "@/components/sidebar";
import { KnowledgeGraph } from "@/components/knowledge-graph";

export default function GraphPage() {
  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans transition-colors duration-150">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto flex flex-col h-screen overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800 border-zinc-200 pb-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold dark:text-white text-zinc-900 tracking-tight">Knowledge Graph Explorer</h1>
            <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-0.5 font-mono">
              Force-directed d3 physics simulation mapping relationships between candidate, jobs, companies, and skills
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <KnowledgeGraph isFullScreen={true} />
        </div>
      </main>
    </div>
  );
}
