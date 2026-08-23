import { NextResponse } from "next/server";
import { resetDemoData } from "@/lib/demo/demo-engine";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const state = await resetDemoData();
    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Reset demo execution failed" }, { status: 500 });
  }
}
