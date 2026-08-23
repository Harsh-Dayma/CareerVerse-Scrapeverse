export type GraphMode = "FOCUS" | "EXPLORE" | "FULL";

export interface RawNode {
  id: string;
  type: "candidate" | "job" | "company" | "skill" | "technology" | "location" | "domain";
  data: {
    label: string;
    sublabel?: string;
    score?: number;
    status?: string;
    category?: string;
    nodeType: string;
    meta?: Record<string, any>;
    isMonitored?: boolean;
  };
  position?: { x: number; y: number };
}

export interface RawEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  animated?: boolean;
  data?: {
    relationship: string;
    score?: number;
  };
}

export function computeVisibleGraph(
  allNodes: RawNode[],
  allEdges: RawEdge[],
  mode: GraphMode,
  searchQuery: string,
  filterType: string,
  expandedNodeIds: Set<string>
): { visibleNodes: RawNode[]; visibleEdges: RawEdge[] } {
  let workingNodes = allNodes;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    const matchedIds = new Set<string>();

    for (const n of allNodes) {
      if (
        n.data.label.toLowerCase().includes(q) ||
        (n.data.sublabel && n.data.sublabel.toLowerCase().includes(q))
      ) {
        matchedIds.add(n.id);
      }
    }

    const searchNeighborhood = new Set(matchedIds);
    for (const e of allEdges) {
      if (matchedIds.has(e.source)) searchNeighborhood.add(e.target);
      if (matchedIds.has(e.target)) searchNeighborhood.add(e.source);
    }
    searchNeighborhood.add("cand-1");

    workingNodes = allNodes.filter((n) => searchNeighborhood.has(n.id));
  } else if (mode === "FOCUS") {
    // FOCUS mode: Top matching jobs (score >= 75) + their companies and primary skills
    const topJobIds = new Set<string>();
    const visibleIds = new Set<string>();
    visibleIds.add("cand-1");

    for (const n of allNodes) {
      if (n.type === "job" && (n.data.score || 0) >= 75) {
        topJobIds.add(n.id);
        visibleIds.add(n.id);
      }
    }

    for (const e of allEdges) {
      if (topJobIds.has(e.source)) visibleIds.add(e.target);
      if (topJobIds.has(e.target)) visibleIds.add(e.source);
      if (e.source === "cand-1" && !e.target.startsWith("job-")) visibleIds.add(e.target);
    }

    for (const expId of Array.from(expandedNodeIds)) {
      for (const e of allEdges) {
        if (e.source === expId) visibleIds.add(e.target);
        if (e.target === expId) visibleIds.add(e.source);
      }
    }

    workingNodes = allNodes.filter((n) => visibleIds.has(n.id));
  } else if (mode === "EXPLORE") {
    const exploreIds = new Set<string>(["cand-1"]);
    for (const expId of Array.from(expandedNodeIds)) {
      exploreIds.add(expId);
      for (const e of allEdges) {
        if (e.source === expId) exploreIds.add(e.target);
        if (e.target === expId) exploreIds.add(e.source);
      }
    }
    for (const n of allNodes.filter((n) => n.type === "job").slice(0, 3)) {
      exploreIds.add(n.id);
      for (const e of allEdges) {
        if (e.source === n.id) exploreIds.add(e.target);
      }
    }
    workingNodes = allNodes.filter((n) => exploreIds.has(n.id));
  }

  if (filterType !== "ALL") {
    workingNodes = workingNodes.filter(
      (n) => n.type === filterType || n.type === "candidate"
    );
  }

  const visibleNodeIds = new Set(workingNodes.map((n) => n.id));
  const visibleEdges = allEdges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  return { visibleNodes: workingNodes, visibleEdges };
}

export function computeNeighborhood(
  activeNodeId: string | null,
  edges: RawEdge[]
): Set<string> | null {
  if (!activeNodeId) return null;
  const set = new Set<string>();
  set.add(activeNodeId);
  for (const e of edges) {
    if (e.source === activeNodeId) set.add(e.target);
    if (e.target === activeNodeId) set.add(e.source);
  }
  return set;
}
