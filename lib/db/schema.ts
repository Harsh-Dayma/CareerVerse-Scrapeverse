import { pgTable, serial, text, integer, boolean, timestamp, doublePrecision, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  experience: text("experience").notNull(),
  education: text("education"),
  bio: text("bio"),
  preferredLocations: text("preferred_locations").array(),
  preferredWorkModes: text("preferred_work_modes").array(),
  preferredDomains: text("preferred_domains").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const candidateSkills = pgTable("candidate_skills", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  category: text("category").default("general"),
  proficiency: text("proficiency").default("intermediate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const candidatePreferences = pgTable("candidate_preferences", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
  minSalary: integer("min_salary"),
  maxSalary: integer("max_salary"),
  currency: text("currency").default("INR"),
  targetRoles: text("target_roles").array(),
  weightsConfig: text("weights_config"), // JSON string of custom weights
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  domain: text("domain"),
  hqLocation: text("hq_location"),
  careersUrl: text("careers_url").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const candidateCompanyMonitors = pgTable("candidate_company_monitors", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const careerPages = pgTable("career_pages", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  department: text("department").default("General"),
  status: text("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scrapers = pgTable("scrapers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  careerPageId: integer("career_page_id").references(() => careerPages.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  collectorId: text("collector_id").notNull(),
  type: text("type").default("DEMO").notNull(), // LIVE | DEMO
  status: text("status").default("HEALTHY").notNull(), // HEALTHY | FAILED | HEALING | RECOVERED | DISABLED
  extractionScore: doublePrecision("extraction_score").default(100).notNull(),
  lastRunAt: timestamp("last_run_at"),
  lastSuccessAt: timestamp("last_success_at"),
  lastFailureAt: timestamp("last_failure_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scrapeRuns = pgTable("scrape_runs", {
  id: serial("id").primaryKey(),
  scraperId: integer("scraper_id").references(() => scrapers.id, { onDelete: "cascade" }).notNull(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  status: text("status").default("RUNNING").notNull(), // RUNNING | COMPLETED | FAILED
  snapshotId: text("snapshot_id"),
  jobsFound: integer("jobs_found").default(0).notNull(),
  validJobs: integer("valid_jobs").default(0).notNull(),
  invalidJobs: integer("invalid_jobs").default(0).notNull(),
  extractionScore: doublePrecision("extraction_score").default(0).notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});

export const scraperEvents = pgTable("scraper_events", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").references(() => scrapeRuns.id, { onDelete: "cascade" }),
  scraperId: integer("scraper_id").references(() => scrapers.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // SCRAPE_STARTED | SCRAPE_COMPLETED | JOB_DISCOVERED | JOB_CHANGED | ANOMALY_DETECTED | HEALING_TRIGGERED | HEALING_VALIDATED | HEALING_RECOVERED | SCRAPE_FAILED
  message: text("message").notNull(),
  payload: text("payload"), // JSON details
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  canonicalId: text("canonical_id").notNull().unique(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  scraperId: integer("scraper_id").references(() => scrapers.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  companyName: text("company_name").notNull(),
  location: text("location").notNull(),
  workMode: text("work_mode").default("Remote").notNull(), // Remote | Hybrid | Onsite
  employmentType: text("employment_type").default("Full-time"), // Full-time | Internship | Contract
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").default("INR"),
  salaryText: text("salary_text"),
  description: text("description").notNull(),
  requirements: text("requirements"),
  experienceLevel: text("experience_level").default("Fresher"),
  applicationUrl: text("application_url").notNull(),
  domain: text("domain").default("Software Engineering").notNull(),
  status: text("status").default("OPEN").notNull(), // OPEN | CLOSED | REOPENED
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  contentHash: text("content_hash").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobSkills = pgTable("job_skills", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  required: boolean("required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobTechnologies = pgTable("job_technologies", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  category: text("category").default("Backend"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobSnapshots = pgTable("job_snapshots", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  canonicalId: text("canonical_id").notNull(),
  snapshotData: text("snapshot_data").notNull(), // JSON of complete state
  contentHash: text("content_hash").notNull(),
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
});

export const jobChanges = pgTable("job_changes", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  canonicalId: text("canonical_id").notNull(),
  fieldName: text("field_name").notNull(), // salary, skills, title, status, etc.
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changeType: text("change_type").default("UPDATED").notNull(), // CREATED | UPDATED | CLOSED | REOPENED
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  overallScore: doublePrecision("overall_score").notNull(),
  skillsScore: doublePrecision("skills_score").notNull(),
  techScore: doublePrecision("tech_score").notNull(),
  roleScore: doublePrecision("role_score").notNull(),
  experienceScore: doublePrecision("experience_score").notNull(),
  locationScore: doublePrecision("location_score").notNull(),
  workModeScore: doublePrecision("work_mode_score").notNull(),
  domainScore: doublePrecision("domain_score").notNull(),
  whyMatch: text("why_match").notNull(), // JSON or explainable string
  skillGaps: text("skill_gaps").notNull(), // JSON string array of gaps
  dimensionBreakdown: text("dimension_breakdown").notNull(), // JSON detailed score report
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // NEW_JOB | JOB_UPDATED | JOB_CLOSING | DEADLINE_APPROACHING | SCRAPER_FAILED | SCRAPER_HEALING | SCRAPER_RECOVERED
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").default("INFO").notNull(), // INFO | SUCCESS | WARNING | CRITICAL
  relatedJobId: integer("related_job_id").references(() => jobs.id, { onDelete: "set null" }),
  relatedScraperId: integer("related_scraper_id").references(() => scrapers.id, { onDelete: "set null" }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  triggerType: text("trigger_type").default("MANUAL").notNull(), // MANUAL | CRON | DEMO
  status: text("status").default("RUNNING").notNull(), // RUNNING | COMPLETED | FAILED
  totalScrapers: integer("total_scrapers").default(0).notNull(),
  successfulScrapers: integer("successful_scrapers").default(0).notNull(),
  failedScrapers: integer("failed_scrapers").default(0).notNull(),
  totalJobsFound: integer("total_jobs_found").default(0).notNull(),
  newJobsCount: integer("new_jobs_count").default(0).notNull(),
  updatedJobsCount: integer("updated_jobs_count").default(0).notNull(),
  closedJobsCount: integer("closed_jobs_count").default(0).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const scanTasks = pgTable("scan_tasks", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").references(() => scans.id, { onDelete: "cascade" }).notNull(),
  scraperId: integer("scraper_id").references(() => scrapers.id, { onDelete: "cascade" }).notNull(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  status: text("status").default("PENDING").notNull(), // PENDING | RUNNING | COMPLETED | FAILED
  jobsCount: integer("jobs_count").default(0).notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const healingEvents = pgTable("healing_events", {
  id: serial("id").primaryKey(),
  scraperId: integer("scraper_id").references(() => scrapers.id, { onDelete: "cascade" }).notNull(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  failureType: text("failure_type").notNull(), // STRUCTURAL_DEGRADATION | MISSING_FIELDS | SELECTOR_MUTATION
  errorReason: text("error_reason").notNull(),
  state: text("state").default("DETECTED").notNull(), // DETECTED | HEALING_REQUESTED | HEALING_IN_PROGRESS | VALIDATING | RECOVERED | FAILED
  beforeSample: text("before_sample"), // JSON string
  afterSample: text("after_sample"), // JSON string
  structuralDiff: text("structural_diff"), // JSON field diff
  validationScore: doublePrecision("validation_score").default(0).notNull(),
  recoveryTimeMs: integer("recovery_time_ms"),
  resolution: text("resolution"),
  metadata: text("metadata"), // JSON metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const candidatesRelations = relations(candidates, ({ many, one }) => ({
  skills: many(candidateSkills),
  preferences: one(candidatePreferences, {
    fields: [candidates.id],
    references: [candidatePreferences.candidateId],
  }),
  monitoredCompanies: many(candidateCompanyMonitors),
  matches: many(matches),
  alerts: many(alerts),
}));

export const candidateCompanyMonitorsRelations = relations(candidateCompanyMonitors, ({ one }) => ({
  candidate: one(candidates, {
    fields: [candidateCompanyMonitors.candidateId],
    references: [candidates.id],
  }),
  company: one(companies, {
    fields: [candidateCompanyMonitors.companyId],
    references: [companies.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  careerPages: many(careerPages),
  scrapers: many(scrapers),
  jobs: many(jobs),
  candidateMonitors: many(candidateCompanyMonitors),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  scraper: one(scrapers, {
    fields: [jobs.scraperId],
    references: [scrapers.id],
  }),
  skills: many(jobSkills),
  technologies: many(jobTechnologies),
  snapshots: many(jobSnapshots),
  changes: many(jobChanges),
  matches: many(matches),
}));

export const scrapersRelations = relations(scrapers, ({ one, many }) => ({
  company: one(companies, {
    fields: [scrapers.companyId],
    references: [companies.id],
  }),
  careerPage: one(careerPages, {
    fields: [scrapers.careerPageId],
    references: [careerPages.id],
  }),
  runs: many(scrapeRuns),
  events: many(scraperEvents),
  healingEvents: many(healingEvents),
  jobs: many(jobs),
}));
