export type RawScrapedJob = {
  id?: string | number;
  external_id?: string | number;
  job_id?: string | number;
  title?: unknown;
  company?: unknown;
  company_name?: unknown;
  location?: unknown;
  work_mode?: unknown;
  workMode?: unknown;
  employment_type?: unknown;
  employmentType?: unknown;
  salary?: unknown;
  salary_min?: unknown;
  salary_max?: unknown;
  salary_currency?: unknown;
  salary_text?: unknown;
  description?: unknown;
  requirements?: unknown;
  experience?: unknown;
  experience_level?: unknown;
  skills?: unknown;
  technologies?: unknown;
  application_url?: unknown;
  applicationUrl?: unknown;
  url?: unknown;
  domain?: unknown;
  category?: unknown;
  deadline?: unknown;
};

export type NormalizedJobData = {
  externalId?: string;
  title: string;
  company: string;
  location: string;
  workMode: "Remote" | "Hybrid" | "Onsite";
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryText?: string;
  description: string;
  requirements: string;
  experienceLevel: string;
  skills: string[];
  technologies: string[];
  applicationUrl: string;
  canonicalUrl: string;
  domain: string;
  deadline?: Date;
};

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "referrer",
  "source",
  "fbclid",
  "gclid",
  "_ga",
  "_gl",
  "gh_src",
  "lever-source",
  "sr_source",
]);

export function cleanUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return trimmed;
    }
    const parsed = new URL(trimmed);
    parsed.hash = ""; // Remove fragments
    const searchParams = new URLSearchParams(parsed.search);
    const toDelete: string[] = [];
    searchParams.forEach((_, key) => {
      if (TRACKING_PARAMS.has(key.toLowerCase()) || key.startsWith("utm_")) {
        toDelete.push(key);
      }
    });
    toDelete.forEach((key) => searchParams.delete(key));
    parsed.search = searchParams.toString();
    let clean = parsed.toString();
    if (clean.endsWith("/") && parsed.pathname !== "/") {
      clean = clean.slice(0, -1);
    }
    return clean;
  } catch {
    return rawUrl.trim();
  }
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => cleanText(v)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,;|•\n]/)
      .map((s) => cleanText(s))
      .filter(Boolean);
  }
  return [];
}

export function parseWorkMode(value: unknown, locationStr: string = ""): "Remote" | "Hybrid" | "Onsite" {
  const combined = `${cleanText(value)} ${locationStr}`.toLowerCase();
  if (combined.includes("remote") || combined.includes("work from home") || combined.includes("wfh")) {
    return "Remote";
  }
  if (combined.includes("hybrid") || combined.includes("flexible")) {
    return "Hybrid";
  }
  return "Onsite";
}

export function normalizeJob(raw: RawScrapedJob): NormalizedJobData {
  const rawUrl = cleanText(raw.application_url || raw.applicationUrl || raw.url);
  const canonicalUrl = cleanUrl(rawUrl);
  const location = cleanText(raw.location) || "Remote";
  const workMode = parseWorkMode(raw.work_mode || raw.workMode, location);
  
  const rawSkills = parseArray(raw.skills);
  const rawTech = parseArray(raw.technologies);

  const title = cleanText(raw.title);
  const company = cleanText(raw.company || raw.company_name);
  const description = cleanText(raw.description);
  const requirements = cleanText(raw.requirements);

  let salaryMin: number | undefined = typeof raw.salary_min === "number" ? raw.salary_min : undefined;
  let salaryMax: number | undefined = typeof raw.salary_max === "number" ? raw.salary_max : undefined;
  let salaryText = cleanText(raw.salary_text || raw.salary);

  return {
    externalId: raw.external_id ? String(raw.external_id) : raw.job_id ? String(raw.job_id) : undefined,
    title: title || "Software Engineer",
    company: company || "Fictional Tech",
    location: location,
    workMode,
    employmentType: cleanText(raw.employment_type || raw.employmentType) || "Full-time",
    salaryMin,
    salaryMax,
    salaryCurrency: cleanText(raw.salary_currency) || "INR",
    salaryText: salaryText || undefined,
    description: description || `${title} at ${company}`,
    requirements: requirements || "",
    experienceLevel: cleanText(raw.experience_level || raw.experience) || "Fresher",
    skills: rawSkills,
    technologies: rawTech.length > 0 ? rawTech : rawSkills.slice(0, 5),
    applicationUrl: rawUrl || canonicalUrl,
    canonicalUrl,
    domain: cleanText(raw.domain || raw.category) || "Software Engineering",
  };
}
