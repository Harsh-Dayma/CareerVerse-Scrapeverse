import { getDb, scrapers, companies, jobs, jobSkills, jobTechnologies, jobSnapshots, jobChanges, matches, alerts, healingEvents, candidates } from "../db";
import { MockBrightDataAdapter } from "../scraper/mock-brightdata";
import { detectStructuralDegradation, validateRepairedPayload } from "../scraper/healing";
import { normalizeJob } from "../normalizer";
import { generateCanonicalId, generateContentHash } from "../identity";
import { calculateDeterministicMatch } from "../matcher";
import { buildSnapshotPayload } from "../temporal";
import { createAlert } from "../alerts";
import { seedDatabase } from "../db/seed";
import { eq } from "drizzle-orm";

export type DemoStage = {
  step: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  detail: string;
  timestamp?: string;
  metadata?: Record<string, any>;
};

export const DEMO_STAGES = [
  { step: "HEALTHY", label: "Baseline Healthy State", detail: "NovaStack, OrbitLabs, and Vertex scrapers operating at 95%+ extraction accuracy." },
  { step: "STRUCTURE_CHANGE", label: "DOM Structure Drift", detail: "QuantumForge website updates HTML classes; .job-apply-link selector breaks." },
  { step: "FAILURE_DETECTED", label: "Anomaly Detected", detail: "Extraction score collapses from 95% to 18%; missing application_url and salary." },
  { step: "HEALING_REQUESTED", label: "Self-Healing Workflow Initiated", detail: "Scraper Studio rule generator inspects DOM diff and proposes button[data-apply-url]." },
  { step: "VALIDATING", label: "Deterministic Validation", detail: "Validation engine checks candidate selector against sample payloads (Score: 100%)." },
  { step: "RECOVERED", label: "Scraper Recovered", detail: "Scraper status restored to RECOVERED; collector updated with verified rule." },
  { step: "NEW_JOBS", label: "New Jobs Discovered", detail: "3 new QuantumForge jobs ingested and normalized into PostgreSQL." },
  { step: "GRAPH_REORGANIZATION", label: "Graph & Physics Reorganization", detail: "New nodes and edges stream to Knowledge Graph; dynamic physics simulation settles." },
  { step: "ALERTS_AND_METRICS", label: "Alerts & Timeline Sync", detail: "In-app notifications dispatched and career radar temporal timeline updated." },
];

let currentStepIndex = 0;

async function getQuantumForgeEntities() {
  const db = getDb();
  let [comp] = await db.select().from(companies).where(eq(companies.slug, "quantumforge")).limit(1);
  if (!comp) {
    const allComps = await db.select().from(companies).limit(1);
    comp = allComps[0];
  }
  let [scraper] = await db.select().from(scrapers).where(eq(scrapers.companyId, comp.id)).limit(1);
  if (!scraper) {
    const allScrapers = await db.select().from(scrapers).limit(1);
    scraper = allScrapers[0];
  }
  return { company: comp, scraper };
}

export async function getDemoState() {
  const db = getDb();
  const { scraper } = await getQuantumForgeEntities();
  const qfHealing = scraper ? await db.select().from(healingEvents).where(eq(healingEvents.scraperId, scraper.id)).limit(1) : [];

  return {
    currentStepIndex,
    totalSteps: DEMO_STAGES.length,
    isCompleted: currentStepIndex >= DEMO_STAGES.length,
    stages: DEMO_STAGES.map((s, idx) => ({
      ...s,
      status: idx < currentStepIndex ? "completed" : idx === currentStepIndex ? "running" : "pending",
    })),
    scraperState: scraper || null,
    healingEvidence: qfHealing[0] || null,
  };
}

export async function executeNextDemoStep(): Promise<any> {
  const db = getDb();
  const mockAdapter = new MockBrightDataAdapter();
  const { company, scraper } = await getQuantumForgeEntities();

  if (!scraper || !company) {
    return getDemoState();
  }

  if (currentStepIndex === 0) {
    // Step 0: Healthy baseline
    currentStepIndex = 1;
    return getDemoState();
  }

  if (currentStepIndex === 1) {
    // Step 1: Structure changed & Anomaly detected
    mockAdapter.setScenario("DEGRADED");
    const degradedResult = await mockAdapter.scrapeCareerPage(company.careersUrl, scraper.collectorId);
    const anomaly = detectStructuralDegradation(
      { title: "Senior Distributed Systems Engineer", company: company.name, location: "Bengaluru", application_url: `${company.careersUrl}/jobs/101`, salary: "₹14L–₹22L" },
      degradedResult.rawJobs
    );

    // Update scraper to FAILED
    await db.update(scrapers).set({
      status: "FAILED",
      extractionScore: degradedResult.extractionScore,
      lastFailureAt: new Date(),
    }).where(eq(scrapers.id, scraper.id));

    // Record HealingEvent
    await db.delete(healingEvents).where(eq(healingEvents.scraperId, scraper.id));
    await db.insert(healingEvents).values({
      scraperId: scraper.id,
      companyId: company.id,
      failureType: anomaly.failureType,
      errorReason: anomaly.errorReason,
      state: "DETECTED",
      beforeSample: JSON.stringify(anomaly.beforeSample),
      afterSample: JSON.stringify(anomaly.afterSample),
      structuralDiff: JSON.stringify(anomaly.structuralDiff),
      validationScore: anomaly.extractionScore,
      metadata: JSON.stringify({ missingFields: anomaly.missingRequiredFields }),
    });

    const [cand] = await db.select().from(candidates).limit(1);
    if (cand) {
      await createAlert({
        candidateId: cand.id,
        type: "SCRAPER_FAILED",
        title: `${company.name} Scraper Degraded`,
        message: `Extraction dropped to ${degradedResult.extractionScore}%. DOM structure changed on career portal.`,
        severity: "WARNING",
        relatedScraperId: scraper.id,
      });
    }

    currentStepIndex = 2;
    return getDemoState();
  }

  if (currentStepIndex === 2 || currentStepIndex === 3) {
    // Healing in progress
    await db.update(scrapers).set({ status: "HEALING" }).where(eq(scrapers.id, scraper.id));
    await db.update(healingEvents).set({ state: "HEALING_IN_PROGRESS" }).where(eq(healingEvents.scraperId, scraper.id));
    currentStepIndex = 4;
    return getDemoState();
  }

  if (currentStepIndex === 4) {
    // Validating
    mockAdapter.setScenario("RECOVERED");
    const recoveredResult = await mockAdapter.scrapeCareerPage(company.careersUrl, scraper.collectorId);
    const val = validateRepairedPayload(recoveredResult.rawJobs);

    await db.update(healingEvents).set({
      state: "VALIDATING",
      validationScore: val.validationScore,
      resolution: val.explanation,
    }).where(eq(healingEvents.scraperId, scraper.id));

    currentStepIndex = 5;
    return getDemoState();
  }

  if (currentStepIndex >= 5) {
    // Recovered & Ingest New Jobs
    mockAdapter.setScenario("RECOVERED");
    const recoveredResult = await mockAdapter.scrapeCareerPage(company.careersUrl, scraper.collectorId);

    await db.update(scrapers).set({
      status: "RECOVERED",
      extractionScore: 100,
      lastSuccessAt: new Date(),
    }).where(eq(scrapers.id, scraper.id));

    await db.update(healingEvents).set({
      state: "RECOVERED",
      validationScore: 100,
      recoveryTimeMs: 1150,
      resolution: "DOM selectors healed. Candidate rule mapped to button[data-apply-url]. 3 jobs discovered.",
    }).where(eq(healingEvents.scraperId, scraper.id));

    // Ingest recovered jobs into DB
    const [cand] = await db.select().from(candidates).limit(1);
    const candId = cand ? cand.id : 1;

    for (const rj of recoveredResult.rawJobs) {
      const normalized = normalizeJob({ ...rj, company: company.name });
      const canonId = generateCanonicalId(normalized);
      const cHash = generateContentHash(normalized);

      // Check if job exists
      const existing = await db.select().from(jobs).where(eq(jobs.canonicalId, canonId)).limit(1);
      if (existing.length === 0) {
        const [saved] = await db.insert(jobs).values({
          canonicalId: canonId,
          companyId: company.id,
          scraperId: scraper.id,
          title: normalized.title,
          companyName: company.name,
          location: normalized.location,
          workMode: normalized.workMode,
          employmentType: normalized.employmentType,
          salaryMin: normalized.salaryMin,
          salaryMax: normalized.salaryMax,
          salaryText: normalized.salaryText,
          description: normalized.description,
          requirements: normalized.requirements,
          experienceLevel: normalized.experienceLevel,
          applicationUrl: normalized.applicationUrl,
          domain: normalized.domain,
          status: "OPEN",
          contentHash: cHash,
          active: true,
        }).returning();

        for (const sk of normalized.skills) {
          await db.insert(jobSkills).values({ jobId: saved.id, name: sk, required: true });
        }
        for (const tc of normalized.technologies) {
          await db.insert(jobTechnologies).values({ jobId: saved.id, name: tc, category: "TechStack" });
        }

        const match = calculateDeterministicMatch(
          { id: saved.id, title: saved.title, companyName: saved.companyName, location: saved.location, workMode: saved.workMode, experienceLevel: saved.experienceLevel, skills: normalized.skills, technologies: normalized.technologies, domain: saved.domain },
          { id: candId, name: cand?.name || "Alex Morgan", role: cand?.role || "CS Graduate", experience: cand?.experience || "Fresher", skills: ["Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Git", "Docker", "REST APIs", "SQL", "Linux"], preferredLocations: ["Bengaluru", "Hyderabad", "Pune", "Remote"], preferredWorkModes: ["Remote", "Hybrid"], preferredDomains: ["Software Engineering", "Web Development", "Backend Development", "Cloud & DevOps"] }
        );

        await db.insert(matches).values({
          candidateId: candId,
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

        await db.insert(jobChanges).values({
          jobId: saved.id,
          canonicalId: canonId,
          fieldName: "status",
          oldValue: "NONE",
          newValue: "OPEN (Recovered Scrape)",
          changeType: "CREATED",
          detectedAt: new Date(),
        });
      }
    }

    if (cand) {
      await createAlert({
        candidateId: cand.id,
        type: "SCRAPER_RECOVERED",
        title: `${company.name} Scraper Healed`,
        message: "Scraper self-healing validated. 3 new roles discovered and matched to your profile.",
        severity: "SUCCESS",
        relatedScraperId: scraper.id,
      });
    }

    currentStepIndex = DEMO_STAGES.length;
    return getDemoState();
  }

  return getDemoState();
}

export async function executeFullDemo() {
  currentStepIndex = 0;
  for (let i = 0; i < DEMO_STAGES.length; i++) {
    await executeNextDemoStep();
  }
  return getDemoState();
}

export async function resetDemoData() {
  currentStepIndex = 0;
  await seedDatabase();
  return getDemoState();
}
