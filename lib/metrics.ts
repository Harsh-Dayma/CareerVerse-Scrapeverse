import { getDb, jobs, companies, scrapers, matches, candidateCompanyMonitors, candidates } from "./db";
import { count, eq, and, inArray } from "drizzle-orm";

export async function getDashboardMetrics(candidateId?: number) {
  const db = getDb();

  let [cand] = candidateId
    ? await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1)
    : [];
  if (!cand) {
    [cand] = await db.select().from(candidates).limit(1);
  }
  const candId = cand?.id || 1;

  // 1. Get Candidate Monitored Companies (Section B4 & B10)
  const monitors = await db
    .select()
    .from(candidateCompanyMonitors)
    .where(and(eq(candidateCompanyMonitors.candidateId, candId), eq(candidateCompanyMonitors.enabled, true)));

  const monitoredCompanyIds = monitors.map((m: any) => m.companyId);
  const isAnyMonitored = monitoredCompanyIds.length > 0;

  // Total monitored companies
  const companiesMonitoredCount = isAnyMonitored
    ? monitoredCompanyIds.length
    : (await db.select({ val: count() }).from(companies))[0]?.val || 10;

  // Scrapers
  const allScrapers = await db.select().from(scrapers);
  const relevantScrapers = isAnyMonitored
    ? allScrapers.filter((s: any) => monitoredCompanyIds.includes(s.companyId))
    : allScrapers;

  const healthyScrapers = relevantScrapers.filter((s: any) => s.status === "HEALTHY" || s.status === "RECOVERED").length;
  const failedScrapers = relevantScrapers.filter((s: any) => s.status === "FAILED").length;
  const recoveredScrapers = relevantScrapers.filter((s: any) => s.status === "RECOVERED").length;

  // Jobs
  const allJobs = await db.select().from(jobs);
  const relevantJobs = isAnyMonitored
    ? allJobs.filter((j: any) => monitoredCompanyIds.includes(j.companyId))
    : allJobs;

  // Matches
  const allMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.candidateId, candId));

  const relevantJobIds = new Set(relevantJobs.map((j: any) => j.id));
  const filteredMatches = allMatches.filter((m: any) => relevantJobIds.has(m.jobId));

  const totalMatchesCount = filteredMatches.length;
  const highMatchesCount = filteredMatches.filter((m: any) => m.overallScore >= 75).length;
  const avgScore =
    totalMatchesCount > 0
      ? Math.round(filteredMatches.reduce((acc: number, m: any) => acc + Number(m.overallScore), 0) / totalMatchesCount)
      : 0;

  return {
    totalJobs: relevantJobs.length,
    newJobs: Math.min(3, relevantJobs.length),
    companiesMonitored: companiesMonitoredCount,
    healthyScrapers,
    failedScrapers,
    recoveredScrapers,
    matchingJobs: highMatchesCount,
    averageMatchScore: avgScore,
  };
}

export const getRadarMetrics = getDashboardMetrics;
