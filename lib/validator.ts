import { NormalizedJobData } from "./normalizer";

export type ValidationResult = {
  isValid: boolean;
  score: number;
  missingFields: string[];
  errors: string[];
};

export function validateJob(job: NormalizedJobData): ValidationResult {
  const required: Array<keyof NormalizedJobData> = [
    "title",
    "company",
    "location",
    "description",
    "applicationUrl",
  ];

  const missingFields: string[] = [];
  const errors: string[] = [];

  for (const field of required) {
    if (!job[field]) {
      missingFields.push(String(field));
    }
  }

  if (!job.title) errors.push("Missing job title");
  if (!job.company) errors.push("Missing company");
  if (!job.location) errors.push("Missing location");
  if (!job.description) errors.push("Missing description");

  if (!job.applicationUrl || !job.applicationUrl.startsWith("http")) {
    errors.push("Invalid application URL");
  }

  const score = ((required.length - missingFields.length) / required.length) * 100;

  return {
    isValid: missingFields.length === 0,
    score,
    missingFields,
    errors,
  };
}
