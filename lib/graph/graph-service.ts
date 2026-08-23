import { getDb, candidates, candidateSkills, candidateCompanyMonitors, jobs, jobSkills, jobTechnologies, companies, matches } from "../db";
import { eq, and, desc } from "drizzle-orm";

export type GraphNodeType =
  | "candidate"
  | "skill"
  | "technology"
  | "job"
  | "company"
  | "location"
  | "domain";

export type GraphNode = {
  id: string;
  type: GraphNodeType;
  data: {
    label: string;
    sublabel?: string;
    score?: number;
    status?: string;
    category?: string;
    nodeType: GraphNodeType;
    meta?: Record<string, any>;
    isMonitored?: boolean;
    connectionsCount?: number;
  };
  position: { x: number; y: number };
};

export type GraphEdgeType =
  | "HAS_SKILL"
  | "REQUIRES_SKILL"
  | "USES_TECHNOLOGY"
  | "POSTED_BY"
  | "LOCATED_IN"
  | "BELONGS_TO_DOMAIN"
  | "MATCHES";

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  animated?: boolean;
  style?: Record<string, any>;
  label?: string;
  data?: {
    relationship: GraphEdgeType;
    score?: number;
  };
};

export async function buildKnowledgeGraph(
  candidateId?: number,
  mode: "FOCUS" | "FULL" = "FOCUS"
): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  monitoredCompanyIds: number[];
}> {
  const db = getDb();

  let [cand] = candidateId
    ? await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1)
    : [];
  if (!cand) {
    [cand] = await db.select().from(candidates).limit(1);
  }
  const candId = cand?.id || 1;

  const candSkills = await db.select().from(candidateSkills).where(eq(candidateSkills.candidateId, candId));
  const allCompanies = await db.select().from(companies);
  const allJobs = await db.select().from(jobs);
  const allMatches = await db.select().from(matches).where(eq(matches.candidateId, candId));
  const monitors = await db
    .select()
    .from(candidateCompanyMonitors)
    .where(and(eq(candidateCompanyMonitors.candidateId, candId), eq(candidateCompanyMonitors.enabled, true)));

  const monitoredCompanyIds = monitors.map((m: any) => m.companyId);
  const monitoredSet = new Set(monitoredCompanyIds);

  const matchMap = new Map<number, number>();
  for (const m of allMatches) {
    matchMap.set(m.jobId, Math.round(m.overallScore));
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const addedNodeIds = new Set<string>();

  function addNode(node: GraphNode) {
    if (!addedNodeIds.has(node.id)) {
      addedNodeIds.add(node.id);
      nodes.push(node);
    }
  }

  function addEdge(edge: GraphEdge) {
    if (!edges.some((e) => e.id === edge.id)) {
      edges.push(edge);
    }
  }

  // 1. Candidate Node (Anchor at 0, 0)
  const candidateNodeId = `cand-${cand?.id || 1}`;
  addNode({
    id: candidateNodeId,
    type: "candidate",
    data: {
      label: cand?.name || "Alex Morgan",
      sublabel: cand?.role || "CS Graduate",
      nodeType: "candidate",
    },
    position: { x: 0, y: 0 },
  });

  // Candidate Skills
  const candidateSkillNames = new Set(candSkills.map((s: any) => s.name.toLowerCase()));
  for (const cs of candSkills.slice(0, 8)) {
    const skillNodeId = `skill-${cs.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    addNode({
      id: skillNodeId,
      type: "skill",
      data: {
        label: cs.name,
        sublabel: "Candidate Skill",
        nodeType: "skill",
      },
      position: { x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 },
    });

    addEdge({
      id: `e-${candidateNodeId}-${skillNodeId}`,
      source: candidateNodeId,
      target: skillNodeId,
      type: "HAS_SKILL",
      label: "HAS_SKILL",
      data: { relationship: "HAS_SKILL" },
    });
  }

  // Determine which jobs to include based on mode & company monitoring (Section A1, A2, B11)
  let targetJobs = allJobs;

  if (mode === "FOCUS") {
    // In FOCUS mode: Prioritize jobs from monitored companies with top match scores (limit to top 5-6 jobs)
    targetJobs = allJobs
      .filter((j: any) => (monitoredSet.size === 0 || monitoredSet.has(j.companyId)))
      .map((j: any) => ({ ...j, score: matchMap.get(j.id) || 70 }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5);
  }

  const includedJobIds = new Set(targetJobs.map((j: any) => j.id));
  const includedCompanyIds = new Set<number>();

  // Add Jobs & Job Edges
  for (let idx = 0; idx < targetJobs.length; idx++) {
    const j = targetJobs[idx];
    const jobNodeId = `job-${j.id}`;
    const score = matchMap.get(j.id) || 75;
    includedCompanyIds.add(j.companyId);

    // Dynamic placement: Higher match scores are placed closer to candidate
    const angle = (idx / (targetJobs.length || 1)) * 2 * Math.PI;
    const dist = 140 + (100 - score) * 3;

    addNode({
      id: jobNodeId,
      type: "job",
      data: {
        label: j.title,
        sublabel: j.companyName,
        score,
        status: j.status,
        nodeType: "job",
        isMonitored: monitoredSet.has(j.companyId),
        meta: {
          location: j.location,
          workMode: j.workMode,
          salaryText: j.salaryText,
          experienceLevel: j.experienceLevel,
        },
      },
      position: { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist },
    });

    // MATCHES Edge
    addEdge({
      id: `e-${candidateNodeId}-${jobNodeId}`,
      source: candidateNodeId,
      target: jobNodeId,
      type: "MATCHES",
      label: `${score}% MATCH`,
      animated: true,
      data: { relationship: "MATCHES", score },
    });

    // Company Node & POSTED_BY Edge
    const comp = allCompanies.find((c: any) => c.id === j.companyId);
    if (comp) {
      const compNodeId = `comp-${comp.id}`;
      addNode({
        id: compNodeId,
        type: "company",
        data: {
          label: comp.name,
          sublabel: comp.domain || "Technology",
          nodeType: "company",
          isMonitored: monitoredSet.has(comp.id),
        },
        position: { x: Math.cos(angle) * (dist + 120), y: Math.sin(angle) * (dist + 120) },
      });

      addEdge({
        id: `e-${jobNodeId}-${compNodeId}`,
        source: jobNodeId,
        target: compNodeId,
        type: "POSTED_BY",
        label: "POSTED_BY",
        data: { relationship: "POSTED_BY" },
      });
    }
  }

  // Skills & Tech attached to included jobs
  const allJobSkills = await db.select().from(jobSkills);
  for (const js of allJobSkills) {
    if (!includedJobIds.has(js.jobId)) continue;

    const skillNodeId = `skill-${js.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const isSharedWithCandidate = candidateSkillNames.has(js.name.toLowerCase());

    if (mode === "FOCUS" && !isSharedWithCandidate && nodes.length > 25) {
      continue;
    }

    addNode({
      id: skillNodeId,
      type: "skill",
      data: {
        label: js.name,
        nodeType: "skill",
      },
      position: { x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 300 },
    });

    addEdge({
      id: `e-job-${js.jobId}-${skillNodeId}`,
      source: `job-${js.jobId}`,
      target: skillNodeId,
      type: "REQUIRES_SKILL",
      label: "REQUIRES_SKILL",
      data: { relationship: "REQUIRES_SKILL" },
    });
  }

  // If in FULL mode, add remaining companies
  if (mode === "FULL") {
    for (const comp of allCompanies) {
      const compNodeId = `comp-${comp.id}`;
      addNode({
        id: compNodeId,
        type: "company",
        data: {
          label: comp.name,
          sublabel: comp.domain || "Technology",
          nodeType: "company",
          isMonitored: monitoredSet.has(comp.id),
        },
        position: { x: (Math.random() - 0.5) * 500, y: (Math.random() - 0.5) * 500 },
      });
    }
  }

  return { nodes, edges, monitoredCompanyIds };
}

export const getKnowledgeGraphData = buildKnowledgeGraph;
