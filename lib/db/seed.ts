import { getDb, candidates, candidateSkills, candidatePreferences, candidateCompanyMonitors, companies, careerPages, scrapers, scrapeRuns, scraperEvents, jobs, jobSkills, jobTechnologies, jobSnapshots, jobChanges, matches, alerts, scans, scanTasks, healingEvents } from "./index";
import { runMigrations } from "./migrate";
import { normalizeJob } from "../normalizer";
import { generateCanonicalId, generateContentHash } from "../identity";
import { calculateDeterministicMatch } from "../matcher";
import { buildSnapshotPayload } from "../temporal";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  await runMigrations();
  const db = getDb();
  console.log("Seeding deterministic CareerVerse demo data...");

  // Clean existing state idempotently
  const tables = [
    "healing_events", "scan_tasks", "scans", "alerts", "matches",
    "job_changes", "job_snapshots", "job_technologies", "job_skills",
    "jobs", "scraper_events", "scrape_runs", "scrapers", "career_pages",
    "candidate_company_monitors", "companies", "candidate_preferences", "candidate_skills", "candidates"
  ];

  for (const table of tables) {
    await db.execute(sql.raw(`DELETE FROM ${table};`));
  }

  // 1. Candidate: Alex Morgan
  const [candidate] = await db
    .insert(candidates)
    .values({
      name: "Alex Morgan",
      email: "alex.morgan@demo.careerverse.local",
      role: "Computer Science Graduate",
      experience: "Fresher / 0–1 years",
      education: "B.Tech in Computer Science & Engineering",
      bio: "Aspiring full-stack engineer and cloud enthusiast passionate about distributed systems, React, Node.js, and PostgreSQL.",
      preferredLocations: ["Bengaluru", "Hyderabad", "Pune", "Remote"],
      preferredWorkModes: ["Remote", "Hybrid"],
      preferredDomains: ["Software Engineering", "Web Development", "Backend Development", "Cloud & DevOps"],
    })
    .returning();

  const candidateSkillNames = [
    "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js",
    "PostgreSQL", "Git", "Docker", "REST APIs", "SQL", "Linux"
  ];

  for (const sName of candidateSkillNames) {
    await db.insert(candidateSkills).values({
      candidateId: candidate.id,
      name: sName,
      category: ["Python", "JavaScript", "TypeScript"].includes(sName) ? "Language" : ["React", "Next.js", "Node.js"].includes(sName) ? "Framework" : "Infrastructure",
      proficiency: "intermediate",
    });
  }

  await db.insert(candidatePreferences).values({
    candidateId: candidate.id,
    minSalary: 800000,
    maxSalary: 2000000,
    currency: "INR",
    targetRoles: ["Software Engineer", "Backend Engineer", "Frontend Developer", "Full Stack Developer", "Cloud Engineer"],
    weightsConfig: JSON.stringify({
      skills: 0.25,
      technologies: 0.20,
      role: 0.15,
      experience: 0.15,
      location: 0.10,
      workMode: 0.10,
      domain: 0.05,
    }),
  });

  // 2. Companies (10 Fictional Companies)
  const companyData = [
    { name: "NovaStack Technologies", slug: "novastack", domain: "Cloud Infrastructure & DevTools", hq: "Bengaluru", url: "https://careers.example.com/novastack", desc: "Next-generation developer productivity and cloud runtime platforms." },
    { name: "OrbitLabs", slug: "orbitlabs", domain: "Distributed Data Platforms", hq: "Hyderabad", url: "https://careers.example.com/orbitlabs", desc: "Real-time streaming storage and distributed compute engines." },
    { name: "Vertex Systems", slug: "vertex", domain: "Enterprise Security & Observability", hq: "Pune", url: "https://careers.example.com/vertex", desc: "Telemetry pipelines and automated infrastructure vulnerability scanners." },
    { name: "QuantumForge", slug: "quantumforge", domain: "High-Performance Compute & AI", hq: "Bengaluru", url: "https://careers.example.com/quantumforge", desc: "Accelerated computing clusters for foundation model inference." },
    { name: "BlueOrbit AI", slug: "blueorbit", domain: "Autonomous AI Agents", hq: "Remote", url: "https://careers.example.com/blueorbit", desc: "Enterprise agentic workflows and multi-modal task automation." },
    { name: "CloudPeak", slug: "cloudpeak", domain: "Cloud-Native Kubernetes & Storage", hq: "Noida", url: "https://careers.example.com/cloudpeak", desc: "Managed Kubernetes control planes and edge storage systems." },
    { name: "NexusWorks", slug: "nexusworks", domain: "FinTech API & Payments", hq: "Mumbai", url: "https://careers.example.com/nexusworks", desc: "High-concurrency payment gateways and ledger reconciliation APIs." },
    { name: "PixelGrid", slug: "pixelgrid", domain: "Design Systems & Web Graphics", hq: "Bengaluru", url: "https://careers.example.com/pixelgrid", desc: "Collaborative design tooling and real-time canvas renderers." },
    { name: "DataNova", slug: "datanova", domain: "Streaming Analytics & Lakehouses", hq: "Hyderabad", url: "https://careers.example.com/datanova", desc: "Petabyte-scale analytical query engines over object storage." },
    { name: "CyberNest", slug: "cybernest", domain: "Zero-Trust Network Architecture", hq: "Chennai", url: "https://careers.example.com/cybernest", desc: "Software-defined perimeter and cryptographic identity verification." },
  ];

  const savedCompanies = [];
  for (const c of companyData) {
    const [comp] = await db.insert(companies).values({
      name: c.name,
      slug: c.slug,
      domain: c.domain,
      hqLocation: c.hq,
      careersUrl: c.url,
      description: c.desc,
      active: true,
    }).returning();

    savedCompanies.push(comp);

    await db.insert(careerPages).values({
      companyId: comp.id,
      name: `${c.name} Careers Portal`,
      url: c.url,
      department: "Engineering & Product",
      status: "ACTIVE",
    });
  }

  // 2B. Seed Initial Candidate Company Monitors (Section B4 & B12)
  // Initially monitor NovaStack (0), OrbitLabs (1), QuantumForge (3), CloudPeak (5), NexusWorks (6)
  const initialMonitoredIndices = [0, 1, 3, 5, 6];
  for (let i = 0; i < savedCompanies.length; i++) {
    const isMonitored = initialMonitoredIndices.includes(i);
    await db.insert(candidateCompanyMonitors).values({
      candidateId: candidate.id,
      companyId: savedCompanies[i].id,
      enabled: isMonitored,
    });
  }

  // 3. Scrapers with realistic health statuses
  const scraperConfigs = [
    { companyIdx: 0, name: "NovaStack Scraper", collectorId: "col_novastack_main", status: "HEALTHY", score: 98 },
    { companyIdx: 1, name: "OrbitLabs Scraper", collectorId: "col_orbitlabs_main", status: "HEALTHY", score: 96 },
    { companyIdx: 2, name: "Vertex Scraper", collectorId: "col_vertex_main", status: "RECOVERED", score: 100 },
    { companyIdx: 3, name: "QuantumForge Scraper", collectorId: "col_quantumforge_main", status: "FAILED", score: 18 },
    { companyIdx: 4, name: "BlueOrbit AI Scraper", collectorId: "col_blueorbit_main", status: "HEALING", score: 65 },
    { companyIdx: 5, name: "CloudPeak Scraper", collectorId: "col_cloudpeak_main", status: "HEALTHY", score: 95 },
    { companyIdx: 6, name: "NexusWorks Scraper", collectorId: "col_nexusworks_main", status: "HEALTHY", score: 92 },
    { companyIdx: 7, name: "PixelGrid Scraper", collectorId: "col_pixelgrid_main", status: "HEALTHY", score: 94 },
    { companyIdx: 8, name: "DataNova Scraper", collectorId: "col_datanova_main", status: "HEALTHY", score: 90 },
    { companyIdx: 9, name: "CyberNest Scraper", collectorId: "col_cybernest_main", status: "HEALTHY", score: 97 },
  ];

  const savedScrapers = [];
  for (const s of scraperConfigs) {
    const comp = savedCompanies[s.companyIdx];
    const [scraper] = await db.insert(scrapers).values({
      companyId: comp.id,
      name: s.name,
      collectorId: s.collectorId,
      type: "DEMO",
      status: s.status,
      extractionScore: s.score,
      lastRunAt: new Date(Date.now() - 3600000),
      lastSuccessAt: s.status === "FAILED" ? new Date(Date.now() - 86400000) : new Date(Date.now() - 3600000),
      lastFailureAt: s.status === "FAILED" ? new Date(Date.now() - 3600000) : null,
    }).returning();

    savedScrapers.push(scraper);
  }

  // 4. 25+ Realistic Jobs Dataset
  const rawJobsSeed = [
    // NovaStack
    { companyIdx: 0, title: "Junior Backend Engineer", location: "Bengaluru", workMode: "Hybrid", salaryText: "₹10L–₹15L", salaryMin: 1000000, salaryMax: 1500000, exp: "Fresher / 0–1 years", domain: "Backend Development", skills: ["TypeScript", "Node.js", "PostgreSQL", "REST APIs", "Git", "Docker"], tech: ["PostgreSQL", "Docker", "Node.js", "Git"], desc: "Build scalable microservices and database access layers using TypeScript and PostgreSQL." },
    { companyIdx: 0, title: "Frontend Developer (React / Next.js)", location: "Remote", workMode: "Remote", salaryText: "₹9L–₹14L", salaryMin: 900000, salaryMax: 1400000, exp: "Fresher / 0–1 years", domain: "Frontend Development", skills: ["React", "Next.js", "TypeScript", "JavaScript", "HTML5", "CSS3"], tech: ["React", "Next.js", "TypeScript"], desc: "Craft intuitive, lightning-fast web interfaces for developer telemetry dashboards." },
    { companyIdx: 0, title: "Full Stack Engineer (Developer Tools)", location: "Bengaluru", workMode: "Hybrid", salaryText: "₹12L–₹18L", salaryMin: 1200000, salaryMax: 1800000, exp: "1–2 years", domain: "Software Engineering", skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"], tech: ["React", "Node.js", "PostgreSQL", "Docker"], desc: "Full stack engineering across React UI, Node backend, and container deployment pipelines." },

    // OrbitLabs
    { companyIdx: 1, title: "Data Platform Associate", location: "Hyderabad", workMode: "Hybrid", salaryText: "₹11L–₹16L", salaryMin: 1100000, salaryMax: 1600000, exp: "Fresher / 0–1 years", domain: "Data Engineering", skills: ["Python", "SQL", "PostgreSQL", "Linux", "Git"], tech: ["Python", "PostgreSQL", "Linux", "Git"], desc: "Design and maintain streaming ETL pipelines and relational data warehouse schemas." },
    { companyIdx: 1, title: "Distributed Systems Software Engineer", location: "Remote", workMode: "Remote", salaryText: "₹14L–₹22L", salaryMin: 1400000, salaryMax: 2200000, exp: "1–3 years", domain: "Software Engineering", skills: ["Python", "Go", "Distributed Systems", "Docker", "Linux"], tech: ["Docker", "Linux", "Git"], desc: "High-throughput message routing and cluster consensus engineering." },
    { companyIdx: 1, title: "QA Automation Engineer (SDET)", location: "Hyderabad", workMode: "Onsite", salaryText: "₹8L–₹12L", salaryMin: 800000, salaryMax: 1200000, exp: "Fresher / 0–1 years", domain: "Quality Assurance", skills: ["Python", "JavaScript", "Playwright", "Git", "REST APIs"], tech: ["Playwright", "Git", "Python"], desc: "Automate end-to-end integration and API testing suites for distributed database features." },

    // Vertex Systems
    { companyIdx: 2, title: "Junior Security Analyst & Tooling Engineer", location: "Pune", workMode: "Hybrid", salaryText: "₹10L–₹14L", salaryMin: 1000000, salaryMax: 1400000, exp: "Fresher / 0–1 years", domain: "Cybersecurity", skills: ["Python", "Linux", "Cybersecurity", "Networking", "Git"], tech: ["Linux", "Git", "Python"], desc: "Implement security automation scripts, vulnerability triage tools, and audit log pipelines." },
    { companyIdx: 2, title: "Site Reliability & Cloud Engineer", location: "Remote", workMode: "Remote", salaryText: "₹13L–₹19L", salaryMin: 1300000, salaryMax: 1900000, exp: "1–2 years", domain: "Cloud & DevOps", skills: ["Docker", "Kubernetes", "AWS", "Linux", "Git", "Python"], tech: ["Docker", "Kubernetes", "AWS", "Linux"], desc: "Manage multi-region Kubernetes clusters and automated CI/CD deployment pipelines." },
    { companyIdx: 2, title: "Backend API Engineer (Observability)", location: "Pune", workMode: "Hybrid", salaryText: "₹11L–₹17L", salaryMin: 1100000, salaryMax: 1700000, exp: "Fresher / 0–2 years", domain: "Backend Development", skills: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "REST APIs"], tech: ["Node.js", "PostgreSQL", "Redis"], desc: "High-volume metrics ingestion APIs and time-series query endpoints." },

    // QuantumForge
    { companyIdx: 3, title: "HPC Software Engineer", location: "Bengaluru", workMode: "Hybrid", salaryText: "₹15L–₹24L", salaryMin: 1500000, salaryMax: 2400000, exp: "1–3 years", domain: "Software Engineering", skills: ["Python", "C++", "Linux", "Distributed Systems"], tech: ["Linux", "Git"], desc: "Optimize GPU memory kernels and high-bandwidth interconnects for neural training." },
    { companyIdx: 3, title: "Junior Cloud Infrastructure Engineer", location: "Remote", workMode: "Remote", salaryText: "₹10L–₹15L", salaryMin: 1000000, salaryMax: 1500000, exp: "Fresher / 0–1 years", domain: "Cloud & DevOps", skills: ["Docker", "AWS", "Linux", "Python", "Git"], tech: ["Docker", "AWS", "Linux", "Git"], desc: "Automate serverless infrastructure provisioning and containerized job scheduling." },

    // BlueOrbit AI
    { companyIdx: 4, title: "AI Application Engineer", location: "Remote", workMode: "Remote", salaryText: "₹12L–₹20L", salaryMin: 1200000, salaryMax: 2000000, exp: "Fresher / 0–1 years", domain: "AI & Machine Learning", skills: ["Python", "TypeScript", "React", "REST APIs", "Node.js"], tech: ["React", "Node.js", "Python"], desc: "Build full-stack agent execution interfaces and tool-calling orchestrators." },
    { companyIdx: 4, title: "Machine Learning Platform Engineer", location: "Remote", workMode: "Remote", salaryText: "₹14L–₹22L", salaryMin: 1400000, salaryMax: 2200000, exp: "1–3 years", domain: "AI & Machine Learning", skills: ["Python", "Docker", "PostgreSQL", "Linux", "REST APIs"], tech: ["Docker", "PostgreSQL", "Linux"], desc: "Deploy scalable model inference pipelines and vector embeddings search backends." },

    // CloudPeak
    { companyIdx: 5, title: "Junior DevOps Engineer", location: "Noida", workMode: "Hybrid", salaryText: "₹9L–₹13L", salaryMin: 900000, salaryMax: 1300000, exp: "Fresher / 0–1 years", domain: "Cloud & DevOps", skills: ["Docker", "Kubernetes", "Linux", "Git", "Python"], tech: ["Docker", "Kubernetes", "Linux", "Git"], desc: "Build automated release pipelines and monitor cluster health telemetry." },
    { companyIdx: 5, title: "Golang Backend Developer", location: "Remote", workMode: "Remote", salaryText: "₹12L–₹18L", salaryMin: 1200000, salaryMax: 1800000, exp: "1–2 years", domain: "Backend Development", skills: ["Go", "Docker", "PostgreSQL", "REST APIs", "Linux"], tech: ["Docker", "PostgreSQL", "Linux"], desc: "Implement resilient microservices for edge storage synchronizations." },

    // NexusWorks
    { companyIdx: 6, title: "FinTech Software Engineer", location: "Mumbai", workMode: "Hybrid", salaryText: "₹11L–₹16L", salaryMin: 1100000, salaryMax: 1600000, exp: "Fresher / 0–1 years", domain: "Software Engineering", skills: ["TypeScript", "Node.js", "PostgreSQL", "REST APIs", "Git"], tech: ["Node.js", "PostgreSQL", "Git"], desc: "Develop ledger transaction services and idempotency validation hooks." },
    { companyIdx: 6, title: "Frontend Web Engineer (Payment UI)", location: "Remote", workMode: "Remote", salaryText: "₹10L–₹15L", salaryMin: 1000000, salaryMax: 1500000, exp: "Fresher / 0–1 years", domain: "Frontend Development", skills: ["React", "Next.js", "TypeScript", "JavaScript"], tech: ["React", "Next.js", "TypeScript"], desc: "Design seamless, accessible checkout workflows with strict latency guarantees." },

    // PixelGrid
    { companyIdx: 7, title: "Web Graphics & Canvas Engineer", location: "Bengaluru", workMode: "Hybrid", salaryText: "₹12L–₹18L", salaryMin: 1200000, salaryMax: 1800000, exp: "Fresher / 0–2 years", domain: "Web Development", skills: ["TypeScript", "JavaScript", "React", "HTML5", "CSS3"], tech: ["React", "TypeScript"], desc: "Develop high-performance vector rendering engines and collaborative canvas UI." },
    { companyIdx: 7, title: "Full Stack UI Systems Engineer", location: "Remote", workMode: "Remote", salaryText: "₹11L–₹16L", salaryMin: 1100000, salaryMax: 1600000, exp: "Fresher / 0–1 years", domain: "Software Engineering", skills: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL"], tech: ["React", "Next.js", "Node.js", "PostgreSQL"], desc: "Build component library distribution platform and design token compilers." },

    // DataNova
    { companyIdx: 8, title: "Data Engineer (Spark / Lakehouse)", location: "Hyderabad", workMode: "Hybrid", salaryText: "₹12L–₹18L", salaryMin: 1200000, salaryMax: 1800000, exp: "1–3 years", domain: "Data Engineering", skills: ["Python", "SQL", "PostgreSQL", "Docker", "Linux"], tech: ["Python", "PostgreSQL", "Docker", "Linux"], desc: "Build analytical ingestion pipelines over Delta Lake and Apache Iceberg." },
    { companyIdx: 8, title: "Junior Python Backend Engineer", location: "Remote", workMode: "Remote", salaryText: "₹9L–₹14L", salaryMin: 900000, salaryMax: 1400000, exp: "Fresher / 0–1 years", domain: "Backend Development", skills: ["Python", "PostgreSQL", "REST APIs", "Git", "Docker"], tech: ["Python", "PostgreSQL", "Docker", "Git"], desc: "Develop REST API endpoints for analytics dashboards and query exports." },

    // CyberNest
    { companyIdx: 9, title: "Network Security Engineer", location: "Chennai", workMode: "Onsite", salaryText: "₹10L–₹15L", salaryMin: 1000000, salaryMax: 1500000, exp: "Fresher / 0–1 years", domain: "Cybersecurity", skills: ["Linux", "Networking", "Python", "Cybersecurity", "Git"], tech: ["Linux", "Git", "Python"], desc: "Configure software-defined access policies, firewall rules, and zero-trust tunnels." },
    { companyIdx: 9, title: "Cloud Security Automation Developer", location: "Remote", workMode: "Remote", salaryText: "₹13L–₹19L", salaryMin: 1300000, salaryMax: 1900000, exp: "1–2 years", domain: "Cybersecurity", skills: ["Python", "Docker", "AWS", "Linux", "Git"], tech: ["Docker", "AWS", "Linux", "Git"], desc: "Build cloud compliance auto-remediation scripts and IAM posture scanners." },
  ];

  const savedJobs = [];
  let jobCounter = 1;
  for (const rj of rawJobsSeed) {
    const comp = savedCompanies[rj.companyIdx];
    const scraper = savedScrapers[rj.companyIdx];
    const normalized = normalizeJob({
      title: rj.title,
      company: comp.name,
      location: rj.location,
      work_mode: rj.workMode,
      salary_text: rj.salaryText,
      salary_min: rj.salaryMin,
      salary_max: rj.salaryMax,
      experience: rj.exp,
      domain: rj.domain,
      skills: rj.skills,
      technologies: rj.tech,
      description: rj.desc,
      application_url: `${comp.careersUrl}/jobs/${jobCounter}`,
    });

    const canonId = generateCanonicalId(normalized);
    const cHash = generateContentHash(normalized);
    const firstSeen = new Date(Date.now() - (30 - jobCounter) * 86400000);

    const [savedJob] = await db
      .insert(jobs)
      .values({
        canonicalId: canonId,
        companyId: comp.id,
        scraperId: scraper.id,
        title: normalized.title,
        companyName: comp.name,
        location: normalized.location,
        workMode: normalized.workMode,
        employmentType: normalized.employmentType,
        salaryMin: normalized.salaryMin,
        salaryMax: normalized.salaryMax,
        salaryText: normalized.salaryText,
        description: normalized.description,
        requirements: `Required skills: ${normalized.skills.join(", ")}`,
        experienceLevel: normalized.experienceLevel,
        applicationUrl: normalized.applicationUrl,
        domain: normalized.domain,
        status: "OPEN",
        firstSeenAt: firstSeen,
        lastSeenAt: new Date(),
        contentHash: cHash,
        active: true,
      })
      .returning();

    savedJobs.push(savedJob);

    for (const sk of normalized.skills) {
      await db.insert(jobSkills).values({ jobId: savedJob.id, name: sk, required: true });
    }

    for (const tc of normalized.technologies) {
      await db.insert(jobTechnologies).values({ jobId: savedJob.id, name: tc, category: "TechStack" });
    }

    const snap = buildSnapshotPayload(normalized, "OPEN");
    await db.insert(jobSnapshots).values({
      jobId: savedJob.id,
      canonicalId: canonId,
      snapshotData: JSON.stringify(snap),
      contentHash: cHash,
      capturedAt: firstSeen,
    });

    const matchRes = calculateDeterministicMatch(
      {
        id: savedJob.id,
        title: savedJob.title,
        companyName: savedJob.companyName,
        location: savedJob.location,
        workMode: savedJob.workMode,
        experienceLevel: savedJob.experienceLevel || "Fresher",
        skills: normalized.skills,
        technologies: normalized.technologies,
        domain: savedJob.domain,
      },
      {
        id: candidate.id,
        name: candidate.name,
        role: candidate.role,
        experience: candidate.experience,
        skills: candidateSkillNames,
        preferredLocations: ["Bengaluru", "Hyderabad", "Pune", "Remote"],
        preferredWorkModes: ["Remote", "Hybrid"],
        preferredDomains: ["Software Engineering", "Web Development", "Backend Development", "Cloud & DevOps"],
      }
    );

    await db.insert(matches).values({
      candidateId: candidate.id,
      jobId: savedJob.id,
      overallScore: matchRes.overallScore,
      skillsScore: matchRes.dimensionScores.skills,
      techScore: matchRes.dimensionScores.technologies,
      roleScore: matchRes.dimensionScores.role,
      experienceScore: matchRes.dimensionScores.experience,
      locationScore: matchRes.dimensionScores.location,
      workModeScore: matchRes.dimensionScores.workMode,
      domainScore: matchRes.dimensionScores.domain,
      whyMatch: matchRes.whyMatch,
      skillGaps: JSON.stringify(matchRes.skillGaps),
      dimensionBreakdown: JSON.stringify(matchRes.explanationList),
    });

    jobCounter++;
  }

  // 5. Temporal History Seeds
  if (savedJobs.length >= 8) {
    await db.insert(jobChanges).values({
      jobId: savedJobs[0].id,
      canonicalId: savedJobs[0].canonicalId,
      fieldName: "salary",
      oldValue: "₹8L–₹12L",
      newValue: "₹10L–₹15L",
      changeType: "UPDATED",
      detectedAt: new Date(Date.now() - 2 * 86400000),
    });

    await db.insert(jobChanges).values({
      jobId: savedJobs[1].id,
      canonicalId: savedJobs[1].canonicalId,
      fieldName: "skills_added",
      oldValue: "",
      newValue: "Next.js",
      changeType: "UPDATED",
      detectedAt: new Date(Date.now() - 4 * 86400000),
    });

    await db.insert(jobChanges).values({
      jobId: savedJobs[7].id,
      canonicalId: savedJobs[7].canonicalId,
      fieldName: "workMode",
      oldValue: "Onsite",
      newValue: "Remote",
      changeType: "UPDATED",
      detectedAt: new Date(Date.now() - 5 * 86400000),
    });
  }

  // 6. Healing Events
  const qfScraper = savedScrapers[3];
  const qfComp = savedCompanies[3];
  if (qfScraper && qfComp) {
    await db.insert(healingEvents).values({
      scraperId: qfScraper.id,
      companyId: qfComp.id,
      failureType: "STRUCTURAL_DEGRADATION",
      errorReason: "Career page DOM markup change: CSS class .job-apply-link mutated to data-apply-btn; application_url and salary selectors failed.",
      state: "RECOVERED",
      beforeSample: JSON.stringify({
        title: "Distributed Systems Engineer",
        company: "QuantumForge",
        location: "Bengaluru",
        salary: "₹14L–₹22L",
        application_url: "https://careers.example.com/quantumforge/jobs/101",
      }),
      afterSample: JSON.stringify({
        title: "Distributed Systems Engineer",
        company: "QuantumForge",
        location: "Bengaluru",
        salary: null,
        application_url: null,
      }),
      structuralDiff: JSON.stringify([
        { field: "application_url", expected: "Present (href string)", observed: "MISSING (Selector .job-apply-link dropped)" },
        { field: "salary", expected: "Present (₹14L–₹22L)", observed: "MISSING (Badge element class changed)" },
      ]),
      validationScore: 100,
      recoveryTimeMs: 1420,
      resolution: "Scraper Studio rule candidate generated: updated selector mapping from a.job-apply-link to button[data-apply-url]. Deterministic validation confirmed 3/3 extracted jobs valid.",
      metadata: JSON.stringify({ automatedValidationPassed: true, recoveredJobsCount: 3 }),
      createdAt: new Date(Date.now() - 7200000),
    });
  }

  // 7. Alerts
  const sampleAlerts = [
    { candidateId: candidate.id, type: "NEW_JOB", title: "Top Match Discovered", message: "Junior Backend Engineer at NovaStack Technologies matches 94% with your profile.", severity: "SUCCESS", relatedJobId: savedJobs[0]?.id, relatedScraperId: savedScrapers[0]?.id },
    { candidateId: candidate.id, type: "JOB_UPDATED", title: "Compensation Updated", message: "NovaStack updated Junior Backend salary from ₹8L–₹12L to ₹10L–₹15L.", severity: "INFO", relatedJobId: savedJobs[0]?.id, relatedScraperId: savedScrapers[0]?.id },
    { candidateId: candidate.id, type: "SCRAPER_FAILED", title: "QuantumForge Scraper Anomaly", message: "QuantumForge career page markup change detected (extraction score dropped to 18%).", severity: "WARNING", relatedScraperId: savedScrapers[3]?.id },
    { candidateId: candidate.id, type: "SCRAPER_RECOVERED", title: "QuantumForge Scraper Recovered", message: "Self-healing pipeline successfully validated updated selectors. 3 new jobs recovered.", severity: "SUCCESS", relatedScraperId: savedScrapers[3]?.id },
    { candidateId: candidate.id, type: "NEW_JOB", title: "Remote Role Match", message: "Frontend Developer (React / Next.js) at NovaStack matches 91% with your skills.", severity: "SUCCESS", relatedJobId: savedJobs[1]?.id, relatedScraperId: savedScrapers[0]?.id },
  ];

  for (const a of sampleAlerts) {
    await db.insert(alerts).values({
      candidateId: a.candidateId,
      type: a.type,
      title: a.title,
      message: a.message,
      severity: a.severity,
      relatedJobId: a.relatedJobId,
      relatedScraperId: a.relatedScraperId,
      read: false,
    });
  }

  // 8. Scans
  await db.insert(scans).values({
    triggerType: "CRON",
    status: "COMPLETED",
    totalScrapers: 10,
    successfulScrapers: 10,
    failedScrapers: 0,
    totalJobsFound: 24,
    newJobsCount: 3,
    updatedJobsCount: 2,
    closedJobsCount: 0,
    startedAt: new Date(Date.now() - 86400000),
    completedAt: new Date(Date.now() - 86400000 + 12000),
  });

  const [scan105] = await db.insert(scans).values({
    triggerType: "CRON",
    status: "COMPLETED",
    totalScrapers: 10,
    successfulScrapers: 9,
    failedScrapers: 1,
    totalJobsFound: 24,
    newJobsCount: 2,
    updatedJobsCount: 1,
    closedJobsCount: 0,
    startedAt: new Date(Date.now() - 3600000),
    completedAt: new Date(Date.now() - 3600000 + 14000),
  }).returning();

  for (const sc of savedScrapers) {
    await db.insert(scanTasks).values({
      scanId: scan105.id,
      scraperId: sc.id,
      companyId: sc.companyId,
      status: sc.status === "FAILED" ? "FAILED" : "COMPLETED",
      jobsCount: sc.status === "FAILED" ? 0 : 2,
      errorMessage: sc.status === "FAILED" ? "Structural degradation on application_url" : null,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 3600000 + 1200),
    });
  }

  console.log("Deterministic seed completed successfully!");
}

if (process.argv[1]?.includes("seed")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
