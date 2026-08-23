import { describe, it, expect, beforeEach } from "vitest";
import { getDb, candidateCompanyMonitors, companies, candidates } from "../lib/db";
import { seedDatabase } from "../lib/db/seed";
import { buildKnowledgeGraph } from "../lib/graph/graph-service";
import { getDashboardMetrics } from "../lib/metrics";
import { eq, and } from "drizzle-orm";

describe("Candidate Company Monitoring & Cross-System Consistency (Section D)", () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it("seeds initial monitored companies for Alex Morgan", async () => {
    const db = getDb();
    const [cand] = await db.select().from(candidates).limit(1);
    expect(cand).toBeDefined();

    const monitors = await db
      .select()
      .from(candidateCompanyMonitors)
      .where(and(eq(candidateCompanyMonitors.candidateId, cand.id), eq(candidateCompanyMonitors.enabled, true)));

    // Initial monitored companies seeded: 5 monitored companies
    expect(monitors.length).toBe(5);

    const metrics = await getDashboardMetrics(cand.id);
    expect(metrics.companiesMonitored).toBe(5);
  });

  it("updates company monitoring selection and reflects in graph & metrics", async () => {
    const db = getDb();
    const [cand] = await db.select().from(candidates).limit(1);
    const [novaComp] = await db.select().from(companies).where(eq(companies.name, "NovaStack Technologies"));
    expect(cand).toBeDefined();
    expect(novaComp).toBeDefined();

    // 1. Initial graph in FOCUS mode includes NovaStack
    const initialGraph = await buildKnowledgeGraph(cand.id, "FOCUS");
    const hasNovaInitial = initialGraph.nodes.some((n) => n.id === `comp-${novaComp.id}`);
    expect(hasNovaInitial).toBe(true);

    // 2. Uncheck NovaStack (disable monitoring)
    await db
      .update(candidateCompanyMonitors)
      .set({ enabled: false, updatedAt: new Date() })
      .where(and(eq(candidateCompanyMonitors.candidateId, cand.id), eq(candidateCompanyMonitors.companyId, novaComp.id)));

    // 3. Confirm metrics update to 4
    const updatedMetrics = await getDashboardMetrics(cand.id);
    expect(updatedMetrics.companiesMonitored).toBe(4);

    // 4. Confirm default FOCUS graph no longer includes NovaStack
    const focusedGraphWithoutNova = await buildKnowledgeGraph(cand.id, "FOCUS");
    const hasNovaInFocus = focusedGraphWithoutNova.nodes.some((n) => n.id === `comp-${novaComp.id}`);
    expect(hasNovaInFocus).toBe(false);

    // 5. Confirm FULL NETWORK mode still retains NovaStack as historical data
    const fullGraph = await buildKnowledgeGraph(cand.id, "FULL");
    const hasNovaInFull = fullGraph.nodes.some((n) => n.id === `comp-${novaComp.id}`);
    expect(hasNovaInFull).toBe(true);

    // 6. Re-enable NovaStack
    await db
      .update(candidateCompanyMonitors)
      .set({ enabled: true, updatedAt: new Date() })
      .where(and(eq(candidateCompanyMonitors.candidateId, cand.id), eq(candidateCompanyMonitors.companyId, novaComp.id)));

    // 7. Confirm NovaStack returns to the focused monitored graph
    const reloadedFocusedGraph = await buildKnowledgeGraph(cand.id, "FOCUS");
    const hasNovaReloaded = reloadedFocusedGraph.nodes.some((n) => n.id === `comp-${novaComp.id}`);
    expect(hasNovaReloaded).toBe(true);
  });
});
