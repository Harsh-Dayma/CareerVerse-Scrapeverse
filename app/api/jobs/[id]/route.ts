import { NextResponse } from "next/server";
import { getDb, jobs, jobSkills, jobTechnologies, jobSnapshots, jobChanges, matches, companies } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const jobId = Number(params.id);
    if (!jobId || isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid Job ID" }, { status: 400 });
    }

    const db = getDb();
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const skills = await db.select().from(jobSkills).where(eq(jobSkills.jobId, jobId));
    const technologies = await db.select().from(jobTechnologies).where(eq(jobTechnologies.jobId, jobId));
    const snapshots = await db.select().from(jobSnapshots).where(eq(jobSnapshots.jobId, jobId)).orderBy(desc(jobSnapshots.capturedAt));
    const changes = await db.select().from(jobChanges).where(eq(jobChanges.jobId, jobId)).orderBy(desc(jobChanges.detectedAt));
    const [match] = await db.select().from(matches).where(eq(matches.jobId, jobId)).limit(1);
    const [company] = await db.select().from(companies).where(eq(companies.id, job.companyId)).limit(1);

    return NextResponse.json({
      ...job,
      company,
      skills: skills.map((s: any) => s.name),
      technologies: technologies.map((t: any) => t.name),
      snapshots: snapshots.map((s: any) => ({ ...s, snapshotData: JSON.parse(s.snapshotData) })),
      changes,
      match: match
        ? {
            overallScore: match.overallScore,
            dimensionScores: {
              skills: match.skillsScore,
              technologies: match.techScore,
              role: match.roleScore,
              experience: match.experienceScore,
              location: match.locationScore,
              workMode: match.workModeScore,
              domain: match.domainScore,
            },
            whyMatch: match.whyMatch,
            skillGaps: JSON.parse(match.skillGaps || "[]"),
            dimensionBreakdown: JSON.parse(match.dimensionBreakdown || "[]"),
          }
        : null,
    });
  } catch (error: any) {
    console.error("GET /api/jobs/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch job" }, { status: 500 });
  }
}
