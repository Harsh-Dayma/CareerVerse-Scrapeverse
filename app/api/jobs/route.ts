import { NextResponse } from "next/server";
import { getDb, jobs, companies, matches, candidateCompanyMonitors } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const workMode = url.searchParams.get("workMode") || "";
    const domain = url.searchParams.get("domain") || "";
    const companyId = url.searchParams.get("companyId") ? Number(url.searchParams.get("companyId")) : null;
    const candidateId = url.searchParams.get("candidateId") ? Number(url.searchParams.get("candidateId")) : 1;
    const monitoredOnly = url.searchParams.get("monitoredOnly") === "true";

    const db = getDb();

    // Check candidate monitors
    const monitors = await db
      .select()
      .from(candidateCompanyMonitors)
      .where(eq(candidateCompanyMonitors.candidateId, candidateId));

    const monitoredMap = new Map<number, boolean>();
    for (const m of monitors) {
      monitoredMap.set(m.companyId, m.enabled);
    }

    const allJobs = await db
      .select({
        id: jobs.id,
        canonicalId: jobs.canonicalId,
        companyId: jobs.companyId,
        companyName: jobs.companyName,
        title: jobs.title,
        location: jobs.location,
        workMode: jobs.workMode,
        employmentType: jobs.employmentType,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        salaryCurrency: jobs.salaryCurrency,
        salaryText: jobs.salaryText,
        description: jobs.description,
        requirements: jobs.requirements,
        experienceLevel: jobs.experienceLevel,
        applicationUrl: jobs.applicationUrl,
        domain: jobs.domain,
        status: jobs.status,
        firstSeenAt: jobs.firstSeenAt,
        lastSeenAt: jobs.lastSeenAt,
        matchScore: matches.overallScore,
        whyMatch: matches.whyMatch,
        skillGaps: matches.skillGaps,
        dimensionBreakdown: matches.dimensionBreakdown,
      })
      .from(jobs)
      .leftJoin(
        matches,
        and(eq(matches.jobId, jobs.id), eq(matches.candidateId, candidateId))
      )
      .orderBy(desc(matches.overallScore), desc(jobs.lastSeenAt))
      .limit(100);

    let enriched = allJobs.map((j: any) => ({
      ...j,
      isMonitored: monitoredMap.has(j.companyId) ? Boolean(monitoredMap.get(j.companyId)) : true,
    }));

    if (monitoredOnly) {
      enriched = enriched.filter((j: any) => j.isMonitored);
    }

    if (search) {
      const q = search.toLowerCase();
      enriched = enriched.filter(
        (j: any) =>
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.domain.toLowerCase().includes(q)
      );
    }

    if (workMode && workMode !== "All") {
      enriched = enriched.filter((j: any) => j.workMode.toLowerCase() === workMode.toLowerCase());
    }

    if (domain && domain !== "All") {
      enriched = enriched.filter((j: any) => j.domain.toLowerCase() === domain.toLowerCase());
    }

    if (companyId) {
      enriched = enriched.filter((j: any) => j.companyId === companyId);
    }

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch jobs" }, { status: 500 });
  }
}
