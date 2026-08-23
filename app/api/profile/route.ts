import { NextResponse } from "next/server";
import { getDb, candidates, candidateSkills, candidatePreferences, candidateCompanyMonitors, companies, scrapers, matches, jobs } from "@/lib/db";
import { parseResumeFile, extractProfileFromText } from "@/lib/parser";
import { calculateDeterministicMatch } from "@/lib/matcher";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const candidateId = url.searchParams.get("candidateId") ? Number(url.searchParams.get("candidateId")) : 1;

    const db = getDb();
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const skills = await db.select().from(candidateSkills).where(eq(candidateSkills.candidateId, candidate.id));
    const [preferences] = await db.select().from(candidatePreferences).where(eq(candidatePreferences.candidateId, candidate.id)).limit(1);

    // Fetch all companies & candidate monitors (Section B2 & B4)
    const allCompanies = await db.select().from(companies);
    const allScrapers = await db.select().from(scrapers);
    const monitors = await db
      .select()
      .from(candidateCompanyMonitors)
      .where(eq(candidateCompanyMonitors.candidateId, candidate.id));

    const monitoredMap = new Map<number, boolean>();
    for (const m of monitors) {
      monitoredMap.set(m.companyId, m.enabled);
    }

    const scraperMap = new Map<number, any>();
    for (const sc of allScrapers) {
      scraperMap.set(sc.companyId, sc);
    }

    const enrichedCompanies = allCompanies.map((c: any) => {
      const sc = scraperMap.get(c.id);
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        domain: c.domain,
        hqLocation: c.hqLocation,
        careersUrl: c.careersUrl,
        isMonitored: monitoredMap.has(c.id) ? Boolean(monitoredMap.get(c.id)) : false,
        scraperStatus: sc?.status || "HEALTHY",
        extractionScore: sc?.extractionScore || 100,
        lastRunAt: sc?.lastRunAt || null,
      };
    });

    const monitoredCompanyIds = enrichedCompanies.filter((c: any) => c.isMonitored).map((c: any) => c.id);

    return NextResponse.json({
      ...candidate,
      skills: skills.map((s: any) => s.name),
      preferences: preferences || null,
      companies: enrichedCompanies,
      monitoredCompanyIds,
    });
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb();
    const contentType = req.headers.get("content-type") || "";

    let extracted: any = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const rawText = formData.get("text") as string | null;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        extracted = await parseResumeFile(buffer, file.name);
      } else if (rawText) {
        extracted = extractProfileFromText(rawText);
      }
    } else {
      const body = await req.json();
      extracted = body;
    }

    if (!extracted) {
      return NextResponse.json({ error: "No profile data provided" }, { status: 400 });
    }

    let [candidate] = await db.select().from(candidates).limit(1);

    if (candidate) {
      await db
        .update(candidates)
        .set({
          name: extracted.name || candidate.name,
          role: extracted.role || candidate.role,
          experience: extracted.experience || candidate.experience,
          education: extracted.education || candidate.education,
          bio: extracted.bio || candidate.bio,
          preferredLocations: extracted.preferredLocations || candidate.preferredLocations,
          preferredWorkModes: extracted.preferredWorkModes || candidate.preferredWorkModes,
          preferredDomains: extracted.preferredDomains || candidate.preferredDomains,
          updatedAt: new Date(),
        })
        .where(eq(candidates.id, candidate.id));
    } else {
      const [newCand] = await db
        .insert(candidates)
        .values({
          name: extracted.name || "Candidate",
          role: extracted.role || "Software Engineer",
          experience: extracted.experience || "Fresher",
          education: extracted.education || "B.Tech Computer Science",
          bio: extracted.bio || "",
          preferredLocations: extracted.preferredLocations || ["Bengaluru", "Remote"],
          preferredWorkModes: extracted.preferredWorkModes || ["Remote", "Hybrid"],
          preferredDomains: extracted.preferredDomains || ["Software Engineering"],
        })
        .returning();
      candidate = newCand;
    }

    if (extracted.skills && Array.isArray(extracted.skills)) {
      await db.delete(candidateSkills).where(eq(candidateSkills.candidateId, candidate.id));
      for (const s of extracted.skills) {
        await db.insert(candidateSkills).values({
          candidateId: candidate.id,
          name: s,
          category: "Technical",
        });
      }
    }

    // Persist Monitored Companies (Section B3 & B4)
    if (extracted.monitoredCompanyIds && Array.isArray(extracted.monitoredCompanyIds)) {
      const selectedIds = new Set<number>(extracted.monitoredCompanyIds.map(Number));
      const allComps = await db.select().from(companies);

      for (const comp of allComps) {
        const isEnabled = selectedIds.has(comp.id);
        const existing = await db
          .select()
          .from(candidateCompanyMonitors)
          .where(and(eq(candidateCompanyMonitors.candidateId, candidate.id), eq(candidateCompanyMonitors.companyId, comp.id)))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(candidateCompanyMonitors)
            .set({ enabled: isEnabled, updatedAt: new Date() })
            .where(eq(candidateCompanyMonitors.id, existing[0].id));
        } else {
          await db.insert(candidateCompanyMonitors).values({
            candidateId: candidate.id,
            companyId: comp.id,
            enabled: isEnabled,
          });
        }
      }
    }

    // Recompute deterministic matches
    const allJobs = await db.select().from(jobs);
    const updatedSkills = (await db.select().from(candidateSkills).where(eq(candidateSkills.candidateId, candidate.id))).map((s: any) => s.name);

    for (const j of allJobs) {
      const match = calculateDeterministicMatch(
        {
          id: j.id,
          title: j.title,
          companyName: j.companyName,
          location: j.location,
          workMode: j.workMode,
          experienceLevel: j.experienceLevel || "Fresher",
          skills: j.requirements ? j.requirements.replace("Required skills: ", "").split(", ") : [],
          technologies: [],
          domain: j.domain,
        },
        {
          id: candidate.id,
          name: candidate.name,
          role: candidate.role,
          experience: candidate.experience,
          skills: updatedSkills,
          preferredLocations: candidate.preferredLocations,
          preferredWorkModes: candidate.preferredWorkModes,
          preferredDomains: candidate.preferredDomains,
        }
      );

      const existingMatch = await db.select().from(matches).where(eq(matches.jobId, j.id)).limit(1);
      if (existingMatch.length > 0) {
        await db
          .update(matches)
          .set({
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
            updatedAt: new Date(),
          })
          .where(eq(matches.id, existingMatch[0].id));
      } else {
        await db.insert(matches).values({
          candidateId: candidate.id,
          jobId: j.id,
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
      }
    }

    return NextResponse.json({ success: true, candidateId: candidate.id });
  } catch (error: any) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
