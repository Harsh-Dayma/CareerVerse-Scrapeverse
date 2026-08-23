import { getDb } from "./index";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  const db = getDb();
  console.log("Running database migrations/table initialization...");

  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      experience TEXT NOT NULL,
      education TEXT,
      bio TEXT,
      preferred_locations TEXT[],
      preferred_work_modes TEXT[],
      preferred_domains TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS candidate_skills (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      proficiency TEXT DEFAULT 'intermediate',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS candidate_preferences (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      min_salary INTEGER,
      max_salary INTEGER,
      currency TEXT DEFAULT 'INR',
      target_roles TEXT[],
      weights_config TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      domain TEXT,
      hq_location TEXT,
      careers_url TEXT NOT NULL,
      active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS candidate_company_monitors (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      enabled BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS career_pages (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      department TEXT DEFAULT 'General',
      status TEXT DEFAULT 'ACTIVE' NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS scrapers (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      career_page_id INTEGER REFERENCES career_pages(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      collector_id TEXT NOT NULL,
      type TEXT DEFAULT 'DEMO' NOT NULL,
      status TEXT DEFAULT 'HEALTHY' NOT NULL,
      extraction_score DOUBLE PRECISION DEFAULT 100 NOT NULL,
      last_run_at TIMESTAMP WITH TIME ZONE,
      last_success_at TIMESTAMP WITH TIME ZONE,
      last_failure_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS scrape_runs (
      id SERIAL PRIMARY KEY,
      scraper_id INTEGER NOT NULL REFERENCES scrapers(id) ON DELETE CASCADE,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'RUNNING' NOT NULL,
      snapshot_id TEXT,
      jobs_found INTEGER DEFAULT 0 NOT NULL,
      valid_jobs INTEGER DEFAULT 0 NOT NULL,
      invalid_jobs INTEGER DEFAULT 0 NOT NULL,
      extraction_score DOUBLE PRECISION DEFAULT 0 NOT NULL,
      error_message TEXT,
      started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      finished_at TIMESTAMP WITH TIME ZONE
    )`,

    `CREATE TABLE IF NOT EXISTS scraper_events (
      id SERIAL PRIMARY KEY,
      run_id INTEGER REFERENCES scrape_runs(id) ON DELETE CASCADE,
      scraper_id INTEGER NOT NULL REFERENCES scrapers(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      payload TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      canonical_id TEXT NOT NULL UNIQUE,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      scraper_id INTEGER REFERENCES scrapers(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      company_name TEXT NOT NULL,
      location TEXT NOT NULL,
      work_mode TEXT DEFAULT 'Remote' NOT NULL,
      employment_type TEXT DEFAULT 'Full-time',
      salary_min INTEGER,
      salary_max INTEGER,
      salary_currency TEXT DEFAULT 'INR',
      salary_text TEXT,
      description TEXT NOT NULL,
      requirements TEXT,
      experience_level TEXT DEFAULT 'Fresher',
      application_url TEXT NOT NULL,
      domain TEXT DEFAULT 'Software Engineering' NOT NULL,
      status TEXT DEFAULT 'OPEN' NOT NULL,
      first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      content_hash TEXT NOT NULL,
      active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS job_skills (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      required BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS job_technologies (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'Backend',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS job_snapshots (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      canonical_id TEXT NOT NULL,
      snapshot_data TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS job_changes (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      canonical_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      change_type TEXT DEFAULT 'UPDATED' NOT NULL,
      detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      overall_score DOUBLE PRECISION NOT NULL,
      skills_score DOUBLE PRECISION NOT NULL,
      tech_score DOUBLE PRECISION NOT NULL,
      role_score DOUBLE PRECISION NOT NULL,
      experience_score DOUBLE PRECISION NOT NULL,
      location_score DOUBLE PRECISION NOT NULL,
      work_mode_score DOUBLE PRECISION NOT NULL,
      domain_score DOUBLE PRECISION NOT NULL,
      why_match TEXT NOT NULL,
      skill_gaps TEXT NOT NULL,
      dimension_breakdown TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT DEFAULT 'INFO' NOT NULL,
      related_job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
      related_scraper_id INTEGER REFERENCES scrapers(id) ON DELETE SET NULL,
      read BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS scans (
      id SERIAL PRIMARY KEY,
      trigger_type TEXT DEFAULT 'MANUAL' NOT NULL,
      status TEXT DEFAULT 'RUNNING' NOT NULL,
      total_scrapers INTEGER DEFAULT 0 NOT NULL,
      successful_scrapers INTEGER DEFAULT 0 NOT NULL,
      failed_scrapers INTEGER DEFAULT 0 NOT NULL,
      total_jobs_found INTEGER DEFAULT 0 NOT NULL,
      new_jobs_count INTEGER DEFAULT 0 NOT NULL,
      updated_jobs_count INTEGER DEFAULT 0 NOT NULL,
      closed_jobs_count INTEGER DEFAULT 0 NOT NULL,
      started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      completed_at TIMESTAMP WITH TIME ZONE
    )`,

    `CREATE TABLE IF NOT EXISTS scan_tasks (
      id SERIAL PRIMARY KEY,
      scan_id INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
      scraper_id INTEGER NOT NULL REFERENCES scrapers(id) ON DELETE CASCADE,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      jobs_count INTEGER DEFAULT 0 NOT NULL,
      error_message TEXT,
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE
    )`,

    `CREATE TABLE IF NOT EXISTS healing_events (
      id SERIAL PRIMARY KEY,
      scraper_id INTEGER NOT NULL REFERENCES scrapers(id) ON DELETE CASCADE,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      failure_type TEXT NOT NULL,
      error_reason TEXT NOT NULL,
      state TEXT DEFAULT 'DETECTED' NOT NULL,
      before_sample TEXT,
      after_sample TEXT,
      structural_diff TEXT,
      validation_score DOUBLE PRECISION DEFAULT 0 NOT NULL,
      recovery_time_ms INTEGER,
      resolution TEXT,
      metadata TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`
  ];

  for (const statement of ddlStatements) {
    await db.execute(sql.raw(statement));
  }

  console.log("Database tables verified successfully.");
}

if (process.argv[1]?.includes("migrate")) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
