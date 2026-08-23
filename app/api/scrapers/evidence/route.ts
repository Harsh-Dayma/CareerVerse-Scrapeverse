import { NextResponse } from "next/server";
import { getDb, healingEvents, scrapers, companies } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const records = await db
      .select({
        id: healingEvents.id,
        scraperId: healingEvents.scraperId,
        scraperName: scrapers.name,
        collectorId: scrapers.collectorId,
        companyName: companies.name,
        careersUrl: companies.careersUrl,
        failureType: healingEvents.failureType,
        errorReason: healingEvents.errorReason,
        state: healingEvents.state,
        beforeSample: healingEvents.beforeSample,
        afterSample: healingEvents.afterSample,
        structuralDiff: healingEvents.structuralDiff,
        validationScore: healingEvents.validationScore,
        recoveryTimeMs: healingEvents.recoveryTimeMs,
        resolution: healingEvents.resolution,
        metadata: healingEvents.metadata,
        createdAt: healingEvents.createdAt,
      })
      .from(healingEvents)
      .leftJoin(scrapers, eq(healingEvents.scraperId, scrapers.id))
      .leftJoin(companies, eq(healingEvents.companyId, companies.id))
      .orderBy(desc(healingEvents.createdAt))
      .limit(20);

    const parsed = records.map((r: any) => ({
      ...r,
      beforeSample: typeof r.beforeSample === "string" ? JSON.parse(r.beforeSample) : r.beforeSample,
      afterSample: typeof r.afterSample === "string" ? JSON.parse(r.afterSample) : r.afterSample,
      structuralDiff: typeof r.structuralDiff === "string" ? JSON.parse(r.structuralDiff) : r.structuralDiff,
      metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata,
    }));

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("GET /api/scrapers/evidence error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch evidence" }, { status: 500 });
  }
}
