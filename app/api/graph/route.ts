import { NextResponse } from "next/server";
import { getKnowledgeGraphData } from "@/lib/graph/graph-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const candidateId = url.searchParams.get("candidateId") ? Number(url.searchParams.get("candidateId")) : 1;
    const mode = (url.searchParams.get("mode") || "FOCUS").toUpperCase() as "FOCUS" | "FULL";
    const graph = await getKnowledgeGraphData(candidateId, mode);
    return NextResponse.json(graph);
  } catch (error: any) {
    console.error("GET /api/graph error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch graph data" }, { status: 500 });
  }
}
