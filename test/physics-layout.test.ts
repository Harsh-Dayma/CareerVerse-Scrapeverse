import { describe, it, expect } from "vitest";
import { computeVisibleGraph, computeNeighborhood, RawNode, RawEdge } from "../lib/graph/graph-state";

describe("Knowledge Graph State & Hard Node Limits", () => {
  const sampleNodes: RawNode[] = [
    { id: "cand-1", type: "candidate", data: { label: "Alex Morgan", nodeType: "candidate" } },
    { id: "job-1", type: "job", data: { label: "Senior Backend Engineer", score: 92, nodeType: "job" } },
    { id: "job-2", type: "job", data: { label: "Low Match Job", score: 45, nodeType: "job" } },
    { id: "comp-1", type: "company", data: { label: "NovaStack", nodeType: "company" } },
    { id: "skill-1", type: "skill", data: { label: "Python", nodeType: "skill" } },
    { id: "skill-2", type: "skill", data: { label: "Docker", nodeType: "skill" } },
  ];

  const sampleEdges: RawEdge[] = [
    { id: "e1", source: "cand-1", target: "job-1", type: "MATCHES", data: { relationship: "MATCHES", score: 92 } },
    { id: "e2", source: "cand-1", target: "job-2", type: "MATCHES", data: { relationship: "MATCHES", score: 45 } },
    { id: "e3", source: "job-1", target: "comp-1", type: "POSTED_BY" },
    { id: "e4", source: "job-1", target: "skill-1", type: "REQUIRES_SKILL" },
    { id: "e5", source: "job-2", target: "skill-2", type: "REQUIRES_SKILL" },
  ];

  it("enforces hard visual node limit in FOCUS mode and filters low-match noise", () => {
    const { visibleNodes } = computeVisibleGraph(
      sampleNodes,
      sampleEdges,
      "FOCUS",
      "",
      "ALL",
      new Set()
    );

    const nodeIds = visibleNodes.map((n) => n.id);
    expect(nodeIds).toContain("cand-1");
    expect(nodeIds).toContain("job-1");
    expect(nodeIds).toContain("comp-1");
    expect(nodeIds).toContain("skill-1");
    expect(nodeIds).not.toContain("job-2");
    expect(nodeIds).not.toContain("skill-2");
  });

  it("computes 1-degree neighborhood for focused dimming without physics reset", () => {
    const neighborhood = computeNeighborhood("job-1", sampleEdges);
    expect(neighborhood).toBeDefined();
    expect(neighborhood?.has("job-1")).toBe(true);
    expect(neighborhood?.has("cand-1")).toBe(true);
    expect(neighborhood?.has("comp-1")).toBe(true);
    expect(neighborhood?.has("skill-1")).toBe(true);
    expect(neighborhood?.has("job-2")).toBe(false);
  });

  it("filters graph by search query and preserves 1-degree connections", () => {
    const { visibleNodes } = computeVisibleGraph(
      sampleNodes,
      sampleEdges,
      "FOCUS",
      "Python",
      "ALL",
      new Set()
    );

    const nodeIds = visibleNodes.map((n) => n.id);
    expect(nodeIds).toContain("skill-1");
    expect(nodeIds).toContain("job-1");
    expect(nodeIds).toContain("cand-1");
  });
});
