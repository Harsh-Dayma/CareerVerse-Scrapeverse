import { NextResponse } from "next/server";
import { getRadarMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const candidateId = url.searchParams.get("candidateId") ? Number(url.searchParams.get("candidateId")) : 1;
    const metrics = await getRadarMetrics(candidateId);
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("GET /api/metrics error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch metrics" }, { status: 500 });
  }
}
