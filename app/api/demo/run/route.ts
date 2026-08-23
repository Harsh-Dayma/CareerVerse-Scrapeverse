import { NextResponse } from "next/server";
import { executeFullDemo } from "@/lib/demo/demo-engine";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const state = await executeFullDemo();
    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Full demo execution failed" }, { status: 500 });
  }
}
