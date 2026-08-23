import { describe, it, expect, beforeAll } from "vitest";
import { executeFullDemo, executeNextDemoStep, resetDemoData, getDemoState } from "../lib/demo/demo-engine";
import { seedDatabase } from "../lib/db/seed";

describe("Deterministic Demo Engine & Persistence", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  it("retrieves initial demo state accurately", async () => {
    const state = await getDemoState();
    expect(state.totalSteps).toBe(9);
    expect(state.stages.length).toBe(9);
    expect(state.scraperState).toBeDefined();
  });

  it("advances step by step through structural degradation and recovery", async () => {
    await resetDemoData();

    // Step 1: Baseline to Structural Change
    const step1 = await executeNextDemoStep();
    expect(step1.currentStepIndex).toBe(1);

    // Step 2: Anomaly detected
    const step2 = await executeNextDemoStep();
    expect(step2.currentStepIndex).toBe(2);
    expect(step2.healingEvidence).toBeDefined();

    // Reset back to clean state
    const resetState = await resetDemoData();
    expect(resetState.currentStepIndex).toBe(0);
  });

  it("executes full demo workflow and ingests recovered jobs", async () => {
    const fullState = await executeFullDemo();
    expect(fullState.isCompleted).toBe(true);
    expect(fullState.scraperState?.status).toBe("RECOVERED");
  });
});
