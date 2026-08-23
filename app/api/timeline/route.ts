import { NextResponse } from "next/server";
import { getDb, jobChanges, jobs, companies } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const changes = await db
      .select({
        id: jobChanges.id,
        jobId: jobChanges.jobId,
        jobTitle: jobs.title,
        companyName: jobs.companyName,
        fieldName: jobChanges.fieldName,
        oldValue: jobChanges.oldValue,
        newValue: jobChanges.newValue,
        changeType: jobChanges.changeType,
        detectedAt: jobChanges.detectedAt,
      })
      .from(jobChanges)
      .leftJoin(jobs, eq(jobChanges.jobId, jobs.id))
      .orderBy(desc(jobChanges.detectedAt))
      .limit(50);

    return NextResponse.json(changes);
  } catch (error: any) {
    console.error("GET /api/timeline error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch timeline" }, { status: 500 });
  }
}
