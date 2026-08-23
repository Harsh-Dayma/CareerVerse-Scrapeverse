import crypto from "crypto";
import { NormalizedJobData, cleanUrl } from "./normalizer";

export function generateCanonicalId(job: NormalizedJobData): string {
  if (job.externalId && job.company) {
    const key = `${job.company.toLowerCase().trim()}#ext#${job.externalId.trim()}`;
    return crypto.createHash("sha256").update(key).digest("hex").slice(0, 32);
  }

  const cleanAppUrl = cleanUrl(job.canonicalUrl || job.applicationUrl);
  const normalizedKey = [
    job.company.toLowerCase().trim(),
    job.title.toLowerCase().trim(),
    cleanAppUrl ? cleanAppUrl.toLowerCase() : job.location.toLowerCase().trim(),
  ].join("|");

  return crypto.createHash("sha256").update(normalizedKey).digest("hex").slice(0, 32);
}

export function generateContentHash(job: NormalizedJobData): string {
  const content = [
    job.title.trim(),
    job.company.trim(),
    job.location.trim(),
    job.workMode,
    job.employmentType,
    job.salaryText || `${job.salaryMin || 0}-${job.salaryMax || 0}`,
    job.description.trim(),
    job.requirements.trim(),
    job.skills.sort().join(","),
    job.technologies.sort().join(","),
    job.canonicalUrl.trim(),
    job.domain.trim(),
  ].join("::");

  return crypto.createHash("sha256").update(content).digest("hex");
}
