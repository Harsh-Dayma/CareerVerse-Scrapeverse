import { NextResponse } from "next/server";
import { executeNextDemoStep } from "@/lib/demo/demo-engine";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const state = await executeNextDemoStep();
    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Next demo step execution failed" }, { status: 500 });
  }
}
