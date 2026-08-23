import { NextResponse } from "next/server";
import { executeNextDemoStep, executeFullDemo, resetDemoData, getDemoState } from "@/lib/demo/demo-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getDemoState();
    return NextResponse.json(state);
  } catch (error: any) {
    console.error("GET /api/demo error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch demo state" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    let state;
    if (action === "next") {
      state = await executeNextDemoStep();
    } else if (action === "run") {
      state = await executeFullDemo();
    } else if (action === "reset") {
      state = await resetDemoData();
    } else {
      state = await getDemoState();
    }

    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    console.error("POST /api/demo error:", error);
    return NextResponse.json({ error: error.message || "Demo execution failed" }, { status: 500 });
  }
}
