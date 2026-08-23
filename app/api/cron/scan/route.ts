import { NextResponse } from "next/server";
import { getDb, scrapers, scans, scanTasks, jobs, jobSkills, jobSnapshots, jobChanges, matches, candidates, candidateSkills, healingEvents } from "@/lib/db";
import { MockBrightDataAdapter } from "@/lib/scraper/mock-brightdata";
import { LiveBrightDataAdapter } from "@/lib/scraper/live-brightdata";
import { detectStructuralDegradation, validateRepairedPayload } from "@/lib/scraper/healing";
import { normalizeJob } from "@/lib/normalizer";
import { generateCanonicalId, generateContentHash } from "@/lib/identity";
import { calculateDeterministicMatch } from "@/lib/matcher";
import { buildSnapshotPayload, compareJobSnapshots } from "@/lib/temporal";
import { createAlert } from "@/lib/alerts";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handleScan(req);
}

export async function POST(req: Request) {
  return handleScan(req);
}

async function handleScan(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Check if query param secret exists for manual invocation
    const url = new URL(req.url);
    const qSecret = url.searchParams.get("secret");
    if (qSecret !== cronSecret && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }
  }

  const db = getDb();
  const startedAt = new Date();

  const [scanRecord] = await db
    .insert(scans)
    .values({
      triggerType: "CRON",
      status: "RUNNING",
      startedAt,
    })
    .returning();

  const allScrapers = await db.select().from(scrapers).where(eq(scrapers.status, "HEALTHY"));
  let totalJobsFound = 0;
  let newJobsCount = 0;
  let updatedJobsCount = 0;

  const [cand] = await db.select().from(candidates).limit(1);
  const candSkills = cand
    ? (await db.select().from(candidateSkills).where(eq(candidateSkills.candidateId, cand.id))).map((s: any) => s.name)
    : [];

  for (const scraper of allScrapers) {
    const taskStart = new Date();
    try {
      const adapter = process.env.BRIGHT_DATA_API_TOKEN
        ? new LiveBrightDataAdapter({
            apiToken: process.env.BRIGHT_DATA_API_TOKEN || "",
            collectorId: scraper.collectorId,
          })
        : new MockBrightDataAdapter();

      const scrapeRes = await adapter.scrapeCareerPage("https://careers.example.com", scraper.collectorId);
      totalJobsFound += scrapeRes.rawJobs.length;

      for (const rj of scrapeRes.rawJobs) {
        const norm = normalizeJob(rj);
        const canonId = generateCanonicalId(norm);
        const cHash = generateContentHash(norm);

        const [existing] = await db.select().from(jobs).where(eq(jobs.canonicalId, canonId)).limit(1);

        if (!existing) {
          newJobsCount++;
          const [saved] = await db
            .insert(jobs)
            .values({
              canonicalId: canonId,
              companyId: scraper.companyId,
              scraperId: scraper.id,
              title: norm.title,
              companyName: norm.company,
              location: norm.location,
              workMode: norm.workMode,
              employmentType: norm.employmentType,
              salaryMin: norm.salaryMin,
              salaryMax: norm.salaryMax,
              salaryText: norm.salaryText,
              description: norm.description,
              requirements: norm.requirements,
              experienceLevel: norm.experienceLevel,
              applicationUrl: norm.applicationUrl,
              domain: norm.domain,
              status: "OPEN",
              contentHash: cHash,
              active: true,
            })
            .returning();

          const snap = buildSnapshotPayload(norm, "OPEN");
          await db.insert(jobSnapshots).values({
            jobId: saved.id,
            canonicalId: canonId,
            snapshotData: JSON.stringify(snap),
            contentHash: cHash,
          });

          await db.insert(jobChanges).values({
            jobId: saved.id,
            canonicalId: canonId,
            fieldName: "status",
            oldValue: "NONE",
            newValue: "OPEN",
            changeType: "CREATED",
          });

          if (cand) {
            const match = calculateDeterministicMatch(
              { id: saved.id, title: saved.title, companyName: saved.companyName, location: saved.location, workMode: saved.workMode, experienceLevel: saved.experienceLevel, skills: norm.skills, technologies: norm.technologies, domain: saved.domain },
              { id: cand.id, name: cand.name, role: cand.role, experience: cand.experience, skills: candSkills, preferredLocations: cand.preferredLocations, preferredWorkModes: cand.preferredWorkModes, preferredDomains: cand.preferredDomains }
            );

            await db.insert(matches).values({
              candidateId: cand.id,
              jobId: saved.id,
              overallScore: match.overallScore,
              skillsScore: match.dimensionScores.skills,
              techScore: match.dimensionScores.technologies,
              roleScore: match.dimensionScores.role,
              experienceScore: match.dimensionScores.experience,
              locationScore: match.dimensionScores.location,
              workModeScore: match.dimensionScores.workMode,
              domainScore: match.dimensionScores.domain,
              whyMatch: match.whyMatch,
              skillGaps: JSON.stringify(match.skillGaps),
              dimensionBreakdown: JSON.stringify(match.explanationList),
            });

            if (match.overallScore >= 80) {
              await createAlert({
                candidateId: cand.id,
                type: "NEW_JOB",
                title: `New High Match: ${saved.title}`,
                message: `${saved.companyName} posted a role matching ${match.overallScore}% with your profile.`,
                severity: "SUCCESS",
                relatedJobId: saved.id,
                relatedScraperId: scraper.id,
              });
            }
          }
        } else if (existing.contentHash !== cHash) {
          updatedJobsCount++;
          const snap = buildSnapshotPayload(norm, "OPEN");
          const diffs = compareJobSnapshots(
            existing.lastSeenAt ? JSON.parse((await db.select().from(jobSnapshots).where(eq(jobSnapshots.jobId, existing.id)).orderBy(jobSnapshots.capturedAt).limit(1))[0]?.snapshotData || "{}") : null,
            norm,
            "OPEN"
          );

          for (const d of diffs) {
            await db.insert(jobChanges).values({
              jobId: existing.id,
              canonicalId: canonId,
              fieldName: d.fieldName,
              oldValue: d.oldValue,
              newValue: d.newValue,
              changeType: d.changeType,
            });
          }

          await db
            .update(jobs)
            .set({
              salaryText: norm.salaryText,
              salaryMin: norm.salaryMin,
              salaryMax: norm.salaryMax,
              requirements: norm.requirements,
              description: norm.description,
              contentHash: cHash,
              lastSeenAt: new Date(),
            })
            .where(eq(jobs.id, existing.id));
        }
      }

      await db.insert(scanTasks).values({
        scanId: scanRecord.id,
        scraperId: scraper.id,
        companyId: scraper.companyId,
        status: "COMPLETED",
        jobsCount: scrapeRes.rawJobs.length,
        startedAt: taskStart,
        completedAt: new Date(),
      });
    } catch (err: any) {
      await db.insert(scanTasks).values({
        scanId: scanRecord.id,
        scraperId: scraper.id,
        companyId: scraper.companyId,
        status: "FAILED",
        errorMessage: err.message,
        startedAt: taskStart,
        completedAt: new Date(),
      });
    }
  }

  await db
    .update(scans)
    .set({
      status: "COMPLETED",
      totalScrapers: allScrapers.length,
      successfulScrapers: allScrapers.length,
      totalJobsFound,
      newJobsCount,
      updatedJobsCount,
      completedAt: new Date(),
    })
    .where(eq(scans.id, scanRecord.id));

  return NextResponse.json({
    success: true,
    scanId: scanRecord.id,
    totalJobsFound,
    newJobsCount,
    updatedJobsCount,
  });
}
