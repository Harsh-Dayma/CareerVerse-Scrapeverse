import { NextResponse } from "next/server";
import { getCandidateAlerts, markAlertRead } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const candidateId = url.searchParams.get("candidateId") ? Number(url.searchParams.get("candidateId")) : 1;
    const alerts = await getCandidateAlerts(candidateId);
    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error("GET /api/alerts error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { alertId } = await req.json();
    if (!alertId) {
      return NextResponse.json({ error: "alertId is required" }, { status: 400 });
    }
    await markAlertRead(Number(alertId));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/alerts error:", error);
    return NextResponse.json({ error: error.message || "Failed to update alert" }, { status: 500 });
  }
}
