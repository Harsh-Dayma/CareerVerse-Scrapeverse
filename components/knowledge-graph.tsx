"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { D3GraphPhysicsEngine, SimulationStats, EntityType } from "@/lib/graph/physics-simulation";
import { computeVisibleGraph, computeNeighborhood, RawNode, RawEdge, GraphMode } from "@/lib/graph/graph-state";
import { GraphInspector } from "@/components/graph-inspector";
import { GraphDebugPanel } from "@/components/graph-debug-panel";
import { useTheme } from "@/components/theme-provider";
import {
  Search,
  Building,
  MapPin,
  Code,
  Cpu,
  Shield,
  Layers,
  Target,
  Compass,
  Globe,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom Distinct Node Shapes with Full Theme Support (Section 63)

// 1. CANDIDATE: Hexagon / Shield Anchor
const CandidateNode = React.memo(function CandidateNode({
  data,
  selected,
}: {
  data: any;
  selected?: boolean;
}) {
  const isDimmed = data.isDimmed;
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-2 transition-all duration-150 cursor-pointer select-none group",
        isDimmed ? "opacity-15 grayscale blur-[0.5px]" : "opacity-100",
        "hover:scale-105"
      )}
    >
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div
        className={cn(
          "h-20 w-24 dark:bg-[#0d1520] bg-cyan-50/90 border-2 flex flex-col items-center justify-center text-center transition-all shadow-sm",
          selected
            ? "dark:border-cyan-400 border-cyan-600 shadow-[0_0_0_3px_rgba(6,182,212,0.3)] scale-105"
            : "dark:border-cyan-500/50 border-cyan-400/80 group-hover:border-cyan-500"
        )}
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
      >
        <Shield size={14} className="dark:text-cyan-400 text-cyan-700 mb-0.5" />
        <span className="text-[11px] font-bold dark:text-white text-zinc-900 leading-tight truncate max-w-[70px]">
          {data.label}
        </span>
        <span className="text-[8px] dark:text-cyan-300/80 text-cyan-700 font-mono mt-0.5">Anchor</span>
      </div>
    </div>
  );
});

// 2. COMPANY: Rounded Rectangle Shape
const CompanyNode = React.memo(function CompanyNode({
  data,
  selected,
}: {
  data: any;
  selected?: boolean;
}) {
  const isDimmed = data.isDimmed;
  return (
    <div
      className={cn(
        "rounded-lg border dark:bg-[#0e1219] bg-white px-3 py-2 shadow-xs min-w-[135px] max-w-[165px] transition-all duration-150 cursor-pointer select-none",
        selected
          ? "border-blue-500 ring-2 ring-blue-500/30 scale-105"
          : "dark:border-zinc-800 border-zinc-200 hover:border-blue-400",
        isDimmed ? "opacity-15 blur-[0.5px]" : "opacity-100",
        "hover:scale-[1.02]"
      )}
    >
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div className="flex items-center gap-2">
        <Building size={12} className="text-blue-500 shrink-0" />
        <div className="overflow-hidden">
          <div className="text-xs font-semibold dark:text-zinc-100 text-zinc-900 truncate">{data.label}</div>
          <div className="text-[9px] dark:text-zinc-500 text-zinc-500 truncate">{data.sublabel || "Company"}</div>
        </div>
      </div>
    </div>
  );
});

// 3. JOB: Rounded Opportunity Card
const JobNode = React.memo(function JobNode({
  data,
  selected,
}: {
  data: any;
  selected?: boolean;
}) {
  const isDimmed = data.isDimmed;
  const score = data.score || 70;
  const isHighMatch = score >= 80;

  return (
    <div
      className={cn(
        "rounded-lg border dark:bg-[#0d1117] bg-white p-2.5 shadow-xs min-w-[155px] max-w-[185px] transition-all duration-150 cursor-pointer select-none",
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/30 scale-105"
          : isHighMatch
          ? "dark:border-emerald-500/40 border-emerald-400/60 hover:border-emerald-500"
          : "dark:border-zinc-800 border-zinc-200 hover:border-emerald-400",
        isDimmed ? "opacity-15 blur-[0.5px]" : "opacity-100",
        "hover:scale-[1.02]"
      )}
    >
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[9px] font-mono dark:text-zinc-400 text-zinc-500 truncate max-w-[90px]">
          {data.sublabel}
        </span>
        <span
          className={cn(
            "text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded",
            isHighMatch
              ? "dark:text-emerald-400 text-emerald-700 dark:bg-emerald-950/60 bg-emerald-100/80 border dark:border-emerald-500/30 border-emerald-300"
              : "dark:text-zinc-400 text-zinc-600 dark:bg-zinc-800 bg-zinc-100 border dark:border-zinc-700 border-zinc-200"
          )}
        >
          {score}%
        </span>
      </div>
      <div className="text-xs font-semibold dark:text-white text-zinc-900 truncate">{data.label}</div>
      {data.meta?.location && (
        <div className="text-[9px] dark:text-zinc-500 text-zinc-500 flex items-center gap-1 mt-1 truncate">
          <MapPin size={9} className="text-zinc-400 shrink-0" />
          <span>{data.meta.location}</span>
        </div>
      )}
    </div>
  );
});

// 4. SKILL: Clean Circle Shape
const SkillNode = React.memo(function SkillNode({
  data,
  selected,
}: {
  data: any;
  selected?: boolean;
}) {
  const isDimmed = data.isDimmed;
  return (
    <div
      className={cn(
        "rounded-full border dark:bg-[#0a111a] bg-cyan-50/70 h-12 w-12 flex flex-col items-center justify-center p-1 text-center shadow-xs transition-all duration-150 cursor-pointer select-none",
        selected
          ? "border-cyan-400 ring-2 ring-cyan-500/30 scale-105"
          : "dark:border-zinc-800 border-zinc-300 hover:border-cyan-400",
        isDimmed ? "opacity-15 blur-[0.5px]" : "opacity-100",
        "hover:scale-105"
      )}
    >
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Code size={10} className="dark:text-cyan-400 text-cyan-600 mb-0.5" />
      <span className="text-[8px] font-mono dark:text-zinc-300 text-zinc-800 truncate max-w-[36px] leading-tight font-medium">
        {data.label}
      </span>
    </div>
  );
});

// 5. TECHNOLOGY: Diamond Shape
const TechNode = React.memo(function TechNode({
  data,
  selected,
}: {
  data: any;
  selected?: boolean;
}) {
  const isDimmed = data.isDimmed;
  return (
    <div
      className={cn(
        "relative h-12 w-12 flex items-center justify-center transition-all duration-150 cursor-pointer select-none group",
        isDimmed ? "opacity-15 blur-[0.5px]" : "opacity-100",
        "hover:scale-105"
      )}
    >
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div
        className={cn(
          "h-10 w-10 rotate-45 border dark:bg-[#110f1a] bg-purple-50/70 flex items-center justify-center transition-all shadow-xs",
          selected
            ? "border-purple-400 ring-2 ring-purple-500/30 scale-105"
            : "dark:border-zinc-800 border-zinc-300 group-hover:border-purple-400"
        )}
      >
        <div className="-rotate-45 flex flex-col items-center justify-center">
          <Cpu size={10} className="dark:text-purple-400 text-purple-600" />
          <span className="text-[7px] font-mono dark:text-zinc-300 text-zinc-800 truncate max-w-[30px] leading-tight font-medium">
            {data.label}
          </span>
        </div>
      </div>
    </div>
  );
});

// 6. LOCATION: Map Pin Teardrop Shape
const LocationNode = React.memo(function LocationNode({
  data,
  selected,
}: {
  data: any;
  selected?: boolean;
}) {
  const isDimmed = data.isDimmed;
  return (
    <div
      className={cn(
        "rounded-xl rounded-br-none border dark:bg-[#14120c] bg-amber-50/70 px-2.5 py-1 shadow-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer select-none",
        selected
          ? "border-amber-500 ring-2 ring-amber-500/30 scale-105"
          : "dark:border-zinc-800 border-zinc-300 hover:border-amber-400",
        isDimmed ? "opacity-15 blur-[0.5px]" : "opacity-100",
        "hover:scale-105"
      )}
    >
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <MapPin size={10} className="text-amber-500 shrink-0" />
      <span className="text-[9px] font-mono dark:text-zinc-300 text-zinc-800 truncate max-w-[70px] font-medium">{data.label}</span>
    </div>
  );
});

// 7. DOMAIN: Octagon Shape
const DomainNode = React.memo(function DomainNode({
  data,
  selected,
}: {
  data: any;
  selected?: boolean;
}) {
  const isDimmed = data.isDimmed;
  return (
    <div
      className={cn(
        "relative p-1 flex items-center justify-center transition-all duration-150 cursor-pointer select-none group",
        isDimmed ? "opacity-15 blur-[0.5px]" : "opacity-100",
        "hover:scale-105"
      )}
    >
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div
        className={cn(
          "h-10 w-24 dark:bg-[#0a1410] bg-emerald-50/70 border flex items-center justify-center gap-1 px-2 text-center transition-all shadow-xs",
          selected
            ? "border-emerald-500 ring-2 ring-emerald-500/30 scale-105"
            : "dark:border-zinc-800 border-zinc-300 group-hover:border-emerald-400"
        )}
        style={{
          clipPath: "polygon(15% 0%, 85% 0%, 100% 25%, 100% 75%, 85% 100%, 15% 100%, 0% 75%, 0% 25%)",
        }}
      >
        <Layers size={9} className="text-emerald-600 shrink-0" />
        <span className="text-[8px] font-mono dark:text-zinc-300 text-zinc-800 truncate max-w-[65px] leading-tight font-medium">
          {data.label}
        </span>
      </div>
    </div>
  );
});

function KnowledgeGraphInner({ isFullScreen = false }: { isFullScreen?: boolean }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [rawNodes, setRawNodes] = useState<RawNode[]>([]);
  const [rawEdges, setRawEdges] = useState<RawEdge[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  // Graph state (Section 40)
  const [graphMode, setGraphMode] = useState<GraphMode>("FOCUS");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [debugStats, setDebugStats] = useState<SimulationStats | null>(null);

  // Persistent D3 Physics Simulation Reference (Section 16)
  const physicsEngineRef = useRef<D3GraphPhysicsEngine | null>(null);
  if (!physicsEngineRef.current) {
    physicsEngineRef.current = new D3GraphPhysicsEngine();
  }

  const reactFlowInstance = useReactFlow();

  const nodeTypes = useMemo(
    () => ({
      candidate: CandidateNode,
      company: CompanyNode,
      job: JobNode,
      skill: SkillNode,
      technology: TechNode,
      location: LocationNode,
      domain: DomainNode,
    }),
    []
  );

  // Load Graph Data from Server
  const loadGraph = useCallback(() => {
    setLoading(true);
    const modeParam = graphMode === "FULL" ? "FULL" : "FOCUS";
    fetch(`/api/graph?mode=${modeParam}`)
      .then((res) => res.json())
      .then((data) => {
        const allNodes: RawNode[] = data.nodes || [];
        const allEdges: RawEdge[] = data.edges || [];
        setRawNodes(allNodes);
        setRawEdges(allEdges);
      })
      .catch((err) => console.error("Failed to load graph data:", err))
      .finally(() => setLoading(false));
  }, [graphMode]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // Compute visible subset based on mode, search, and expansions
  const { visibleNodes, visibleEdges } = useMemo(() => {
    return computeVisibleGraph(rawNodes, rawEdges, graphMode, searchQuery, filterType, expandedNodeIds);
  }, [rawNodes, rawEdges, graphMode, searchQuery, filterType, expandedNodeIds]);

  // Update Physics Simulation when visible graph entities change
  useEffect(() => {
    if (visibleNodes.length === 0) return;
    const engine = physicsEngineRef.current;
    if (!engine) return;

    const simNodes = visibleNodes.map((n) => ({
      id: n.id,
      type: n.type as EntityType,
      label: n.data.label,
      sublabel: n.data.sublabel,
      score: n.data.score,
      meta: n.data.meta,
      isMonitored: n.data.isMonitored,
    }));

    const simLinks = visibleEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type,
      score: e.data?.score,
    }));

    engine.setGraph(simNodes, simLinks, 0.4);
  }, [visibleNodes, visibleEdges]);

  // Subscribe to D3 Physics Simulation Ticks
  useEffect(() => {
    const engine = physicsEngineRef.current;
    if (!engine) return;

    engine.subscribeTicks((positions) => {
      setNodes((prev) => {
        let changed = false;
        const next = prev.map((node) => {
          const pos = positions.get(node.id);
          if (pos && (pos.x !== node.position.x || pos.y !== node.position.y)) {
            changed = true;
            return {
              ...node,
              position: { x: pos.x, y: pos.y },
            };
          }
          return node;
        });
        return changed ? next : prev;
      });
    });

    engine.subscribeStats((stats) => {
      setDebugStats(stats);
    });
  }, [setNodes]);

  // Compute Neighborhood ONLY for Selected Node
  const neighborhoodSet = useMemo(() => {
    return computeNeighborhood(selectedNodeId, visibleEdges);
  }, [selectedNodeId, visibleEdges]);

  // Build React Flow Nodes & Edges on topology, selection, or theme change (Section 63)
  useEffect(() => {
    const positions = physicsEngineRef.current?.getPositions() || new Map();

    const mappedFlowNodes: Node[] = visibleNodes.map((n) => {
      const isSelected = selectedNodeId === n.id;
      const isDimmed = neighborhoodSet ? !neighborhoodSet.has(n.id) : false;
      const pos = positions.get(n.id) || n.position || { x: 0, y: 0 };

      return {
        id: n.id,
        type: n.type,
        data: { ...n.data, isDimmed },
        selected: isSelected,
        position: pos,
      };
    });

    const mappedFlowEdges: Edge[] = visibleEdges.map((e) => {
      const isConnectedToSelected =
        selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);
      const isDimmed = neighborhoodSet
        ? !(neighborhoodSet.has(e.source) && neighborhoodSet.has(e.target))
        : false;

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: !!isConnectedToSelected || e.type === "MATCHES",
        label: isConnectedToSelected ? e.label || e.type : undefined,
        labelStyle: { fill: isDark ? "#cbd5e1" : "#334155", fontSize: 9, fontFamily: "monospace" },
        labelBgStyle: { fill: isDark ? "#0f172a" : "#f1f5f9", stroke: isDark ? "#334155" : "#cbd5e1", strokeWidth: 1 },
        style: {
          stroke: isConnectedToSelected
            ? isDark ? "#06b6d4" : "#0284c7"
            : e.type === "MATCHES"
            ? isDark ? "rgba(16, 185, 129, 0.45)" : "rgba(5, 150, 105, 0.55)"
            : isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(100, 116, 139, 0.25)",
          strokeWidth: isConnectedToSelected ? 2 : 1,
          opacity: isDimmed ? 0.08 : 1,
        },
      };
    });

    setNodes(mappedFlowNodes);
    setEdges(mappedFlowEdges);
  }, [visibleNodes, visibleEdges, selectedNodeId, neighborhoodSet, isDark, setNodes, setEdges]);

  // True Physical Drag Lifecycle (Section 6 & 7)
  const onNodeDragStart = useCallback((_: any, node: Node) => {
    physicsEngineRef.current?.onNodeDragStart(node.id, node.position.x, node.position.y);
  }, []);

  const onNodeDrag = useCallback((_: any, node: Node) => {
    physicsEngineRef.current?.onNodeDrag(node.id, node.position.x, node.position.y);
  }, []);

  const onNodeDragStop = useCallback((_: any, node: Node) => {
    physicsEngineRef.current?.onNodeDragEnd(node.id);
  }, []);

  // Node Click: Visual Selection Only
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Controlled Expand / Collapse
  const toggleExpandNode = useCallback(
    (nodeId: string) => {
      setExpandedNodeIds((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
          const childrenNodes = rawNodes.filter((n) => {
            return rawEdges.some(
              (e) => (e.source === nodeId && e.target === n.id) || (e.target === nodeId && e.source === n.id)
            );
          });
          const childrenLinks = rawEdges.filter((e) => e.source === nodeId || e.target === nodeId);
          physicsEngineRef.current?.addNodesAroundParent(
            nodeId,
            childrenNodes.map((n) => ({
              id: n.id,
              type: n.type as EntityType,
              label: n.data.label,
              sublabel: n.data.sublabel,
              score: n.data.score,
              meta: n.data.meta,
            })),
            childrenLinks
          );
        }
        return next;
      });
    },
    [rawNodes, rawEdges]
  );

  const resetView = useCallback(() => {
    setSelectedNodeId(null);
    setSearchQuery("");
    setFilterType("ALL");
    setGraphMode("FOCUS");
    setExpandedNodeIds(new Set());
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.25, duration: 400 });
    }, 100);
  }, [reactFlowInstance]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    const found = rawNodes.find((n) => n.id === selectedNodeId);
    if (!found) return null;
    return {
      id: found.id,
      type: found.type,
      label: found.data.label,
      sublabel: found.data.sublabel,
      score: found.data.score,
      meta: found.data.meta,
      isMonitored: found.data.isMonitored,
    };
  }, [selectedNodeId, rawNodes]);

  return (
    <div
      className={cn(
        "relative w-full rounded-xl border dark:border-zinc-800 border-zinc-200 dark:bg-[#06080d] bg-slate-50 overflow-hidden select-none transition-colors duration-150",
        isFullScreen ? "h-[calc(100vh-140px)] min-h-[600px]" : "h-[540px]"
      )}
    >
      {/* Top Workspace Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-col md:flex-row md:items-center justify-between gap-2.5 dark:bg-black/80 bg-white/90 backdrop-blur-md p-2.5 rounded-lg border dark:border-zinc-800 border-zinc-200 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Mode Switcher: FOCUS / EXPLORE / FULL */}
          <div className="flex items-center rounded-md border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/80 bg-zinc-100 p-0.5 text-xs font-medium">
            <button
              onClick={() => setGraphMode("FOCUS")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
                graphMode === "FOCUS"
                  ? "dark:bg-cyan-500/10 bg-cyan-100 dark:text-cyan-400 text-cyan-800 font-semibold"
                  : "dark:text-zinc-400 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Target size={12} />
              Focus (15–25)
            </button>
            <button
              onClick={() => setGraphMode("EXPLORE")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
                graphMode === "EXPLORE"
                  ? "dark:bg-purple-500/10 bg-purple-100 dark:text-purple-400 text-purple-800 font-semibold"
                  : "dark:text-zinc-400 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Compass size={12} />
              Explore
            </button>
            <button
              onClick={() => setGraphMode("FULL")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
                graphMode === "FULL"
                  ? "dark:bg-zinc-800 bg-zinc-200 dark:text-zinc-200 text-zinc-900 font-semibold"
                  : "dark:text-zinc-400 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Globe size={12} />
              Full Network
            </button>
          </div>

          <span className="text-[11px] font-mono dark:text-zinc-500 text-zinc-500 hidden sm:inline">
            {nodes.length} nodes · {edges.length} links
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search (e.g. Python)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/90 bg-white pl-7 pr-2.5 py-1 text-xs dark:text-white text-zinc-900 placeholder-zinc-400 focus:outline-none dark:focus:border-zinc-700 focus:border-zinc-400 w-40 shadow-xs"
            />
          </div>

          {/* Filter Types */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/90 bg-white px-2 py-1 text-xs dark:text-zinc-300 text-zinc-700 focus:outline-none shadow-xs"
          >
            <option value="ALL">All Types</option>
            <option value="job">Jobs</option>
            <option value="company">Companies</option>
            <option value="skill">Skills</option>
            <option value="technology">Technologies</option>
            <option value="location">Locations</option>
            <option value="domain">Domains</option>
          </select>

          {/* Reset View Button */}
          <button
            onClick={resetView}
            className="rounded-md border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/90 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 px-2.5 py-1 text-xs dark:text-zinc-300 text-zinc-700 transition-colors flex items-center gap-1 shadow-xs"
            title="Reset to Candidate Focus"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center dark:bg-black/80 bg-white/80 text-xs dark:text-zinc-400 text-zinc-600 font-mono">
          Loading relational graph...
        </div>
      )}

      {/* ReactFlow Canvas with Theme-Aware Background & Controls (Section 63) */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        minZoom={0.2}
        maxZoom={2.0}
      >
        <Background color={isDark ? "#1e293b" : "#cbd5e1"} gap={28} size={1} />
        <Controls className="!dark:bg-[#090d14] !bg-white !dark:border-zinc-800 !border-zinc-200 !dark:text-zinc-300 !text-zinc-700 shadow-sm" />
        <MiniMap
          nodeStrokeWidth={2}
          nodeColor={(n: any) => {
            if (n.type === "candidate") return isDark ? "#06b6d4" : "#0284c7";
            if (n.type === "company") return isDark ? "#3b82f6" : "#2563eb";
            if (n.type === "job") return isDark ? "#10b981" : "#059669";
            if (n.type === "skill") return isDark ? "#06b6d4" : "#0284c7";
            if (n.type === "technology") return isDark ? "#8b5cf6" : "#7c3aed";
            if (n.type === "location") return isDark ? "#f59e0b" : "#d97706";
            return isDark ? "#10b981" : "#059669";
          }}
          className="!dark:bg-[#06080d] !bg-slate-50 !dark:border-zinc-800 !border-zinc-200 shadow-xs"
        />
      </ReactFlow>

      {/* Minimalist Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2.5 dark:bg-black/80 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md border dark:border-zinc-800 border-zinc-200 text-[10px] font-mono dark:text-zinc-400 text-zinc-600 shadow-xs flex-wrap">
        <span className="flex items-center gap-1 dark:text-cyan-400 text-cyan-700">
          <span>⬡</span> Candidate
        </span>
        <span className="flex items-center gap-1 dark:text-blue-400 text-blue-700">
          <span>▣</span> Company
        </span>
        <span className="flex items-center gap-1 dark:text-emerald-400 text-emerald-700">
          <span>▢</span> Job
        </span>
        <span className="flex items-center gap-1 dark:text-cyan-300 text-cyan-600">
          <span>●</span> Skill
        </span>
        <span className="flex items-center gap-1 dark:text-purple-400 text-purple-700">
          <span>◆</span> Tech
        </span>
        <span className="flex items-center gap-1 dark:text-amber-400 text-amber-700">
          <span>⌖</span> Location
        </span>
        <span className="flex items-center gap-1 dark:text-emerald-300 text-emerald-600">
          <span>⬢</span> Domain
        </span>
      </div>

      {/* Graph Debug Telemetry Panel */}
      <GraphDebugPanel stats={debugStats} />

      {/* Node Inspector Side Panel */}
      <GraphInspector
        node={selectedNode}
        isExpanded={selectedNodeId ? expandedNodeIds.has(selectedNodeId) : false}
        connectionCount={neighborhoodSet ? Math.max(0, neighborhoodSet.size - 1) : 0}
        onClose={() => setSelectedNodeId(null)}
        onToggleExpand={toggleExpandNode}
      />
    </div>
  );
}

export function KnowledgeGraph(props: { isFullScreen?: boolean }) {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner {...props} />
    </ReactFlowProvider>
  );
}
