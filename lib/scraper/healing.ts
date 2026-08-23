import { RawScrapedJob } from "../normalizer";

export type HealingState =
  | "DETECTED"
  | "HEALING_REQUESTED"
  | "HEALING_IN_PROGRESS"
  | "VALIDATING"
  | "RECOVERED"
  | "FAILED";

export type StructuralAnomalyReport = {
  hasAnomaly: boolean;
  failureType: string;
  errorReason: string;
  missingRequiredFields: string[];
  droppedFields: string[];
  extractionScore: number;
  beforeSample: Record<string, any>;
  afterSample: Record<string, any>;
  structuralDiff: {
    field: string;
    expected: string;
    observed: string;
  }[];
};

export function detectStructuralDegradation(
  previousSample: Record<string, any> | null,
  currentBatch: RawScrapedJob[]
): StructuralAnomalyReport {
  const defaultExpected: Record<string, any> = {
    title: "Software Engineer",
    company: "Company",
    location: "Location",
    application_url: "https://example.com/job",
    salary: "₹10L–₹15L",
    skills: ["Python", "React"],
  };

  const beforeSample: Record<string, any> = previousSample && Object.keys(previousSample).length > 0 ? previousSample : defaultExpected;
  const currentSample: Record<string, any> = currentBatch[0] || {};

  const requiredFields = ["title", "company", "location", "application_url"];
  const missingRequiredFields: string[] = [];
  const structuralDiff: { field: string; expected: string; observed: string }[] = [];

  for (const field of requiredFields) {
    const hasInCurrent =
      field === "company"
        ? Boolean(currentSample.company || currentSample.company_name)
        : field === "application_url"
        ? Boolean(currentSample.application_url || currentSample.applicationUrl || currentSample.url)
        : Boolean(currentSample[field]);

    if (!hasInCurrent) {
      missingRequiredFields.push(field);
      structuralDiff.push({
        field,
        expected: `Present (${beforeSample[field] || "string"})`,
        observed: "MISSING (Selector failed)",
      });
    }
  }

  if (beforeSample.salary && !currentSample.salary && !currentSample.salary_text && !currentSample.salary_min) {
    structuralDiff.push({
      field: "salary",
      expected: `Present (${beforeSample.salary})`,
      observed: "MISSING",
    });
  }

  const hasAnomaly = missingRequiredFields.length > 0 || currentBatch.length === 0;
  const validJobs = currentBatch.filter((j) => (j.title && (j.application_url || j.applicationUrl || j.url))).length;
  const extractionScore = currentBatch.length > 0 ? Math.round((validJobs / currentBatch.length) * 100) : 0;

  return {
    hasAnomaly,
    failureType: missingRequiredFields.includes("application_url")
      ? "STRUCTURAL_DEGRADATION"
      : "MISSING_FIELDS",
    errorReason: hasAnomaly
      ? `Career page markup change: ${missingRequiredFields.join(", ")} missing from extracted payload`
      : "Schema matches baseline expectation",
    missingRequiredFields,
    droppedFields: structuralDiff.map((d) => d.field),
    extractionScore,
    beforeSample,
    afterSample: currentSample,
    structuralDiff,
  };
}

export function validateRepairedPayload(repairedBatch: RawScrapedJob[]): {
  isValid: boolean;
  validationScore: number;
  validCount: number;
  explanation: string;
} {
  if (!repairedBatch || repairedBatch.length === 0) {
    return {
      isValid: false,
      validationScore: 0,
      validCount: 0,
      explanation: "Repaired extraction candidate returned 0 jobs.",
    };
  }

  let valid = 0;
  for (const job of repairedBatch) {
    const hasTitle = Boolean(job.title);
    const hasUrl = Boolean(job.application_url || job.applicationUrl || job.url);
    const hasCompany = Boolean(job.company || job.company_name);

    if (hasTitle && hasUrl && hasCompany) {
      valid++;
    }
  }

  const validationScore = Math.round((valid / repairedBatch.length) * 100);
  const isValid = validationScore >= 80;

  return {
    isValid,
    validationScore,
    validCount: valid,
    explanation: isValid
      ? `Deterministic validator confirmed ${valid}/${repairedBatch.length} jobs have valid title, company, and application URL selectors.`
      : `Deterministic validation failed: only ${validationScore}% jobs passed required schema checks.`,
  };
}
