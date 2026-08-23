import { NextResponse } from "next/server";
import { getDb, scrapers, companies, candidateCompanyMonitors } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { MockBrightDataAdapter } from "@/lib/scraper/mock-brightdata";
import { LiveBrightDataAdapter } from "@/lib/scraper/live-brightdata";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const candidateId = url.searchParams.get("candidateId") ? Number(url.searchParams.get("candidateId")) : 1;

    const db = getDb();
    const allScrapers = await db
      .select({
        id: scrapers.id,
        name: scrapers.name,
        collectorId: scrapers.collectorId,
        companyId: scrapers.companyId,
        companyName: companies.name,
        careersUrl: companies.careersUrl,
        type: scrapers.type,
        status: scrapers.status,
        extractionScore: scrapers.extractionScore,
        lastRunAt: scrapers.lastRunAt,
        lastSuccessAt: scrapers.lastSuccessAt,
        lastFailureAt: scrapers.lastFailureAt,
      })
      .from(scrapers)
      .leftJoin(companies, eq(scrapers.companyId, companies.id))
      .orderBy(desc(scrapers.id));

    // Check candidate monitors
    const monitors = await db
      .select()
      .from(candidateCompanyMonitors)
      .where(eq(candidateCompanyMonitors.candidateId, candidateId));

    const monitoredMap = new Map<number, boolean>();
    for (const m of monitors) {
      monitoredMap.set(m.companyId, m.enabled);
    }

    const enrichedScrapers = allScrapers.map((s: any) => ({
      ...s,
      isMonitored: monitoredMap.has(s.companyId) ? Boolean(monitoredMap.get(s.companyId)) : true,
    }));

    return NextResponse.json(enrichedScrapers);
  } catch (error: any) {
    console.error("GET /api/scrapers error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch scrapers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scraperId } = body;

    const db = getDb();
    const [scraper] = await db.select().from(scrapers).where(eq(scrapers.id, Number(scraperId))).limit(1);

    if (!scraper) {
      return NextResponse.json({ error: "Scraper not found" }, { status: 404 });
    }

    const [company] = await db.select().from(companies).where(eq(companies.id, scraper.companyId)).limit(1);
    const careersUrl = company?.careersUrl || "https://careers.example.com";

    const isLive = Boolean(process.env.BRIGHT_DATA_API_TOKEN && process.env.BRIGHT_DATA_COLLECTOR_ID);
    const adapter = isLive
      ? new LiveBrightDataAdapter({
          apiToken: process.env.BRIGHT_DATA_API_TOKEN || "",
          collectorId: process.env.BRIGHT_DATA_COLLECTOR_ID || "",
        })
      : new MockBrightDataAdapter();

    const result = await adapter.scrapeCareerPage(careersUrl, scraper.collectorId);

    await db
      .update(scrapers)
      .set({
        lastRunAt: new Date(),
        lastSuccessAt: result.success ? new Date() : scraper.lastSuccessAt,
        lastFailureAt: !result.success ? new Date() : scraper.lastFailureAt,
        extractionScore: result.extractionScore,
        status: result.success ? "HEALTHY" : "FAILED",
      })
      .where(eq(scrapers.id, scraper.id));

    return NextResponse.json({
      success: result.success,
      jobsFound: result.rawJobs.length,
      extractionScore: result.extractionScore,
      jobs: result.rawJobs,
    });
  } catch (error: any) {
    console.error("POST /api/scrapers error:", error);
    return NextResponse.json({ error: error.message || "Scrape execution failed" }, { status: 500 });
  }
}
