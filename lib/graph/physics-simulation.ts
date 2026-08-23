import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceCenter,
  forceX,
  forceY,
  Simulation,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";

export type EntityType =
  | "candidate"
  | "job"
  | "company"
  | "skill"
  | "technology"
  | "location"
  | "domain";

export interface D3SimNode extends SimulationNodeDatum {
  id: string;
  type: EntityType;
  label: string;
  sublabel?: string;
  score?: number;
  radius: number;
  width: number;
  height: number;
  meta?: Record<string, any>;
  isMonitored?: boolean;
}

export interface D3SimLink extends SimulationLinkDatum<D3SimNode> {
  id: string;
  source: string | D3SimNode;
  target: string | D3SimNode;
  type: string;
  score?: number;
  distance?: number;
  strength?: number;
}

export interface SimulationStats {
  alpha: number;
  averageVelocity: number;
  status: "RUNNING" | "SETTLED";
  nodeCount: number;
  edgeCount: number;
  fps: number;
}

export class D3GraphPhysicsEngine {
  private simulation: Simulation<D3SimNode, D3SimLink> | null = null;
  private nodesMap: Map<string, D3SimNode> = new Map();
  private linksMap: Map<string, D3SimLink> = new Map();
  private onTickCallback?: (positions: Map<string, { x: number; y: number }>) => void;
  private onStatsCallback?: (stats: SimulationStats) => void;
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private currentFps = 60;
  private isRunning = false;

  constructor() {
    this.initSimulation();
  }

  private getNodeDimensions(type: EntityType): { radius: number; width: number; height: number } {
    switch (type) {
      case "candidate":
        return { radius: 85, width: 96, height: 80 };
      case "company":
        return { radius: 75, width: 145, height: 50 };
      case "job":
        return { radius: 70, width: 165, height: 60 };
      case "domain":
        return { radius: 65, width: 100, height: 40 };
      case "location":
        return { radius: 55, width: 90, height: 35 };
      case "technology":
        return { radius: 50, width: 48, height: 48 };
      case "skill":
      default:
        return { radius: 50, width: 48, height: 48 };
    }
  }

  private initSimulation() {
    this.simulation = forceSimulation<D3SimNode, D3SimLink>()
      .alphaMin(0.001)
      .alphaDecay(0.022)
      .velocityDecay(0.45)
      .force(
        "charge",
        forceManyBody<D3SimNode>()
          .strength((d) => (d.type === "candidate" ? -1400 : d.type === "company" ? -900 : -650))
          .distanceMax(650)
      )
      .force(
        "collide",
        forceCollide<D3SimNode>()
          .radius((d) => d.radius + 18)
          .iterations(3)
      )
      .force(
        "link",
        forceLink<D3SimNode, D3SimLink>()
          .id((d) => d.id)
          .distance((l) => {
            if (l.distance) return l.distance;
            if (l.type === "MATCHES") {
              const score = l.score || 75;
              return 120 + (100 - score) * 2.5;
            }
            if (l.type === "POSTED_BY") return 140;
            if (l.type === "REQUIRES_SKILL") return 130;
            if (l.type === "USES_TECHNOLOGY") return 130;
            return 170;
          })
          .strength((l) => {
            if (l.strength) return l.strength;
            if (l.type === "MATCHES") return 0.7;
            if (l.type === "POSTED_BY") return 0.55;
            if (l.type === "REQUIRES_SKILL") return 0.45;
            return 0.3;
          })
      )
      .force("x", forceX<D3SimNode>(0).strength(0.035))
      .force("y", forceY<D3SimNode>(0).strength(0.035))
      .on("tick", () => this.handleTick())
      .on("end", () => this.handleEnd());
  }

  private handleTick() {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFrameTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    if (!this.simulation) return;

    const positions = new Map<string, { x: number; y: number }>();
    let totalVelocity = 0;
    const nodes = this.simulation.nodes();

    for (const node of nodes) {
      if (node.type === "candidate" && node.fx === null && node.fy === null) {
        node.x = 0;
        node.y = 0;
        node.vx = 0;
        node.vy = 0;
      }

      positions.set(node.id, {
        x: Math.round(node.x || 0),
        y: Math.round(node.y || 0),
      });

      totalVelocity += Math.hypot(node.vx || 0, node.vy || 0);
    }

    const avgVelocity = nodes.length > 0 ? totalVelocity / nodes.length : 0;
    const alpha = this.simulation.alpha();

    if (this.onTickCallback) {
      this.onTickCallback(positions);
    }

    if (this.onStatsCallback) {
      this.onStatsCallback({
        alpha: Math.round(alpha * 1000) / 1000,
        averageVelocity: Math.round(avgVelocity * 1000) / 1000,
        status: alpha > 0.001 ? "RUNNING" : "SETTLED",
        nodeCount: nodes.length,
        edgeCount: this.linksMap.size,
        fps: this.currentFps,
      });
    }
  }

  private handleEnd() {
    this.isRunning = false;
    if (this.onStatsCallback) {
      this.onStatsCallback({
        alpha: 0,
        averageVelocity: 0,
        status: "SETTLED",
        nodeCount: this.nodesMap.size,
        edgeCount: this.linksMap.size,
        fps: this.currentFps,
      });
    }
  }

  public setGraph(
    rawNodes: Array<{ id: string; type: EntityType; label: string; sublabel?: string; score?: number; meta?: any; isMonitored?: boolean }>,
    rawLinks: Array<{ id: string; source: string; target: string; type: string; score?: number }>,
    reheatAlpha: number = 0.5
  ) {
    if (!this.simulation) this.initSimulation();
    const sim = this.simulation!;

    const currentNodes = sim.nodes();
    const existingPosMap = new Map<string, { x: number; y: number; vx: number; vy: number; fx?: number | null; fy?: number | null }>();

    for (const n of currentNodes) {
      existingPosMap.set(n.id, {
        x: n.x || 0,
        y: n.y || 0,
        vx: n.vx || 0,
        vy: n.vy || 0,
        fx: n.fx,
        fy: n.fy,
      });
    }

    const newNodes: D3SimNode[] = rawNodes.map((n, idx) => {
      const existing = existingPosMap.get(n.id);
      const dims = this.getNodeDimensions(n.type);

      if (existing) {
        return {
          ...n,
          radius: dims.radius,
          width: dims.width,
          height: dims.height,
          x: existing.x,
          y: existing.y,
          vx: existing.vx,
          vy: existing.vy,
          fx: existing.fx,
          fy: existing.fy,
        };
      }

      let initX = 0;
      let initY = 0;

      if (n.type === "candidate") {
        initX = 0;
        initY = 0;
      } else if (n.type === "job") {
        const score = n.score || 75;
        const angle = (idx * 1.35) % (2 * Math.PI);
        const dist = 140 + (100 - score) * 3;
        initX = Math.cos(angle) * dist;
        initY = Math.sin(angle) * dist;
      } else if (n.type === "company") {
        const angle = ((idx + 0.5) * 1.35) % (2 * Math.PI);
        initX = Math.cos(angle) * 260;
        initY = Math.sin(angle) * 260;
      } else {
        const angle = ((idx + 1.2) * 0.95) % (2 * Math.PI);
        initX = Math.cos(angle) * (180 + (idx % 4) * 45);
        initY = Math.sin(angle) * (180 + (idx % 4) * 45);
      }

      return {
        ...n,
        radius: dims.radius,
        width: dims.width,
        height: dims.height,
        x: initX,
        y: initY,
        vx: 0,
        vy: 0,
      };
    });

    this.nodesMap.clear();
    for (const n of newNodes) {
      this.nodesMap.set(n.id, n);
    }

    const validNodeIds = new Set(newNodes.map((n) => n.id));
    const validLinks: D3SimLink[] = rawLinks
      .filter((l) => validNodeIds.has(l.source) && validNodeIds.has(l.target))
      .map((l) => ({
        id: l.id,
        source: l.source,
        target: l.target,
        type: l.type,
        score: l.score,
      }));

    this.linksMap.clear();
    for (const l of validLinks) {
      this.linksMap.set(l.id, l);
    }

    sim.nodes(newNodes);
    (sim.force("link") as any).links(validLinks);

    this.isRunning = true;
    sim.alpha(reheatAlpha).restart();
  }

  public addNodesAroundParent(
    parentId: string,
    nodesToAdd: Array<{ id: string; type: EntityType; label: string; sublabel?: string; score?: number; meta?: any }>,
    linksToAdd: Array<{ id: string; source: string; target: string; type: string; score?: number }>
  ) {
    if (!this.simulation) return;

    const parent = this.nodesMap.get(parentId);
    const parentX = parent?.x || 0;
    const parentY = parent?.y || 0;

    const existingNodes = this.simulation.nodes();
    const existingNodeIds = new Set(existingNodes.map((n) => n.id));

    const newlyAdded: D3SimNode[] = [];
    nodesToAdd.forEach((n, idx) => {
      if (!existingNodeIds.has(n.id)) {
        const dims = this.getNodeDimensions(n.type);
        const angle = (idx / (nodesToAdd.length || 1)) * 2 * Math.PI;
        const offset = 60 + Math.random() * 20;

        const newNode: D3SimNode = {
          ...n,
          radius: dims.radius,
          width: dims.width,
          height: dims.height,
          x: parentX + Math.cos(angle) * offset,
          y: parentY + Math.sin(angle) * offset,
          vx: 0,
          vy: 0,
        };

        this.nodesMap.set(newNode.id, newNode);
        newlyAdded.push(newNode);
      }
    });

    const combinedNodes = [...existingNodes, ...newlyAdded];
    this.simulation.nodes(combinedNodes);

    for (const l of linksToAdd) {
      this.linksMap.set(l.id, { ...l });
    }

    const allLinks = Array.from(this.linksMap.values());
    (this.simulation.force("link") as any).links(allLinks);

    this.simulation.alpha(0.25).restart();
  }

  public onNodeDragStart(nodeId: string, x: number, y: number) {
    if (!this.simulation) return;
    const node = this.nodesMap.get(nodeId);
    if (node) {
      node.x = x;
      node.y = y;
      node.fx = x;
      node.fy = y;
      this.simulation.alphaTarget(0.25).restart();
    }
  }

  public onNodeDrag(nodeId: string, x: number, y: number) {
    const node = this.nodesMap.get(nodeId);
    if (node) {
      node.x = x;
      node.y = y;
      node.fx = x;
      node.fy = y;
    }
  }

  public onNodeDragEnd(nodeId: string) {
    if (!this.simulation) return;
    const node = this.nodesMap.get(nodeId);
    if (node) {
      if (node.type !== "candidate") {
        node.fx = null;
        node.fy = null;
      }
      this.simulation.alphaTarget(0);
    }
  }

  public subscribeTicks(callback: (positions: Map<string, { x: number; y: number }>) => void) {
    this.onTickCallback = callback;
  }

  public subscribeStats(callback: (stats: SimulationStats) => void) {
    this.onStatsCallback = callback;
  }

  public getPositions(): Map<string, { x: number; y: number }> {
    const map = new Map<string, { x: number; y: number }>();
    if (this.simulation) {
      for (const node of this.simulation.nodes()) {
        map.set(node.id, { x: Math.round(node.x || 0), y: Math.round(node.y || 0) });
      }
    }
    return map;
  }

  public destroy() {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
    this.nodesMap.clear();
    this.linksMap.clear();
  }
}
