import { describe, it, expect } from "vitest";
import { D3GraphPhysicsEngine } from "../lib/graph/physics-simulation";
import { computeVisibleGraph, computeNeighborhood, RawNode, RawEdge } from "../lib/graph/graph-state";

describe("D3-Force Graph Physics Engine & Graph State", () => {
  it("initializes d3-force continuous simulation and sets nodes and links", () => {
    const engine = new D3GraphPhysicsEngine();
    const testNodes = [
      { id: "cand-1", type: "candidate" as const, label: "Alex Morgan" },
      { id: "job-1", type: "job" as const, label: "Backend Engineer", score: 92 },
      { id: "comp-1", type: "company" as const, label: "NovaStack" },
      { id: "skill-1", type: "skill" as const, label: "Python" },
    ];
    const testLinks = [
      { id: "e1", source: "cand-1", target: "job-1", type: "MATCHES", score: 92 },
      { id: "e2", source: "job-1", target: "comp-1", type: "POSTED_BY" },
      { id: "e3", source: "job-1", target: "skill-1", type: "REQUIRES_SKILL" },
    ];

    engine.setGraph(testNodes, testLinks, 0.5);

    const positions = engine.getPositions();
    expect(positions.size).toBe(4);
    expect(positions.has("cand-1")).toBe(true);
    expect(positions.get("cand-1")?.x).toBe(0);
    expect(positions.get("cand-1")?.y).toBe(0);
    engine.destroy();
  });

  it("handles physical node drag lifecycle without recreating simulation", () => {
    const engine = new D3GraphPhysicsEngine();
    engine.setGraph(
      [
        { id: "cand-1", type: "candidate", label: "Alex" },
        { id: "job-1", type: "job", label: "Job 1", score: 85 },
      ],
      [{ id: "e1", source: "cand-1", target: "job-1", type: "MATCHES", score: 85 }]
    );

    // 1. Drag start pins node
    engine.onNodeDragStart("job-1", 150, 200);
    let positions = engine.getPositions();
    expect(positions.get("job-1")?.x).toBe(150);
    expect(positions.get("job-1")?.y).toBe(200);

    // 2. Drag update
    engine.onNodeDrag("job-1", 200, 250);
    positions = engine.getPositions();
    expect(positions.get("job-1")?.x).toBe(200);
    expect(positions.get("job-1")?.y).toBe(250);

    // 3. Drag end unpins node
    engine.onNodeDragEnd("job-1");
    positions = engine.getPositions();
    expect(positions.has("job-1")).toBe(true);
    engine.destroy();
  });

  it("smoothly expands new nodes around parent without graph explosion", () => {
    const engine = new D3GraphPhysicsEngine();
    engine.setGraph(
      [
        { id: "cand-1", type: "candidate", label: "Alex" },
        { id: "job-1", type: "job", label: "Job 1" },
      ],
      [{ id: "e1", source: "cand-1", target: "job-1", type: "MATCHES" }]
    );

    // Expand job-1 with 2 new skills
    engine.addNodesAroundParent(
      "job-1",
      [
        { id: "skill-1", type: "skill", label: "Python" },
        { id: "skill-2", type: "skill", label: "PostgreSQL" },
      ],
      [
        { id: "e2", source: "job-1", target: "skill-1", type: "REQUIRES_SKILL" },
        { id: "e3", source: "job-1", target: "skill-2", type: "REQUIRES_SKILL" },
      ]
    );

    const positions = engine.getPositions();
    expect(positions.size).toBe(4);
    expect(positions.has("skill-1")).toBe(true);
    expect(positions.has("skill-2")).toBe(true);
    engine.destroy();
  });
});
