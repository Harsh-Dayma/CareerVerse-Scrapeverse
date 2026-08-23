import { NormalizedJobData } from "./normalizer";
import { generateContentHash } from "./identity";

export type FieldDiff = {
  fieldName: string;
  oldValue: string;
  newValue: string;
  changeType: "CREATED" | "UPDATED" | "CLOSED" | "REOPENED";
};

export type JobSnapshotPayload = {
  title: string;
  companyName: string;
  location: string;
  workMode: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryText?: string;
  description: string;
  skills: string[];
  technologies: string[];
  applicationUrl: string;
  domain: string;
  status: "OPEN" | "CLOSED" | "REOPENED";
  capturedAt: string;
};

export function compareJobSnapshots(
  previousSnapshot: JobSnapshotPayload | null,
  currentJob: NormalizedJobData,
  currentStatus: "OPEN" | "CLOSED" | "REOPENED" = "OPEN"
): FieldDiff[] {
  const diffs: FieldDiff[] = [];

  if (!previousSnapshot) {
    diffs.push({
      fieldName: "status",
      oldValue: "NONE",
      newValue: "OPEN",
      changeType: "CREATED",
    });
    return diffs;
  }

  // Check status transition
  if (previousSnapshot.status !== currentStatus) {
    diffs.push({
      fieldName: "status",
      oldValue: previousSnapshot.status,
      newValue: currentStatus,
      changeType: currentStatus === "CLOSED" ? "CLOSED" : currentStatus === "REOPENED" ? "REOPENED" : "UPDATED",
    });
  }

  // Check title
  if (previousSnapshot.title !== currentJob.title) {
    diffs.push({
      fieldName: "title",
      oldValue: previousSnapshot.title,
      newValue: currentJob.title,
      changeType: "UPDATED",
    });
  }

  // Check location
  if (previousSnapshot.location !== currentJob.location) {
    diffs.push({
      fieldName: "location",
      oldValue: previousSnapshot.location,
      newValue: currentJob.location,
      changeType: "UPDATED",
    });
  }

  // Check work mode
  if (previousSnapshot.workMode !== currentJob.workMode) {
    diffs.push({
      fieldName: "workMode",
      oldValue: previousSnapshot.workMode,
      newValue: currentJob.workMode,
      changeType: "UPDATED",
    });
  }

  // Check salary
  const prevSalary = previousSnapshot.salaryText || (previousSnapshot.salaryMin ? `₹${previousSnapshot.salaryMin / 100000}L–₹${(previousSnapshot.salaryMax || 0) / 100000}L` : "");
  const newSalary = currentJob.salaryText || (currentJob.salaryMin ? `₹${currentJob.salaryMin / 100000}L–₹${(currentJob.salaryMax || 0) / 100000}L` : "");
  if (prevSalary && newSalary && prevSalary !== newSalary) {
    diffs.push({
      fieldName: "salary",
      oldValue: prevSalary,
      newValue: newSalary,
      changeType: "UPDATED",
    });
  }

  // Check skills additions / removals
  const prevSkills = new Set(previousSnapshot.skills.map((s) => s.toLowerCase()));
  const newSkills = new Set(currentJob.skills.map((s) => s.toLowerCase()));

  const addedSkills = currentJob.skills.filter((s) => !prevSkills.has(s.toLowerCase()));
  const removedSkills = previousSnapshot.skills.filter((s) => !newSkills.has(s.toLowerCase()));

  if (addedSkills.length > 0) {
    diffs.push({
      fieldName: "skills_added",
      oldValue: "",
      newValue: addedSkills.join(", "),
      changeType: "UPDATED",
    });
  }

  if (removedSkills.length > 0) {
    diffs.push({
      fieldName: "skills_removed",
      oldValue: removedSkills.join(", "),
      newValue: "",
      changeType: "UPDATED",
    });
  }

  // Check application URL
  if (previousSnapshot.applicationUrl !== currentJob.applicationUrl && previousSnapshot.applicationUrl !== currentJob.canonicalUrl) {
    diffs.push({
      fieldName: "applicationUrl",
      oldValue: previousSnapshot.applicationUrl,
      newValue: currentJob.applicationUrl,
      changeType: "UPDATED",
    });
  }

  return diffs;
}

export function buildSnapshotPayload(
  job: NormalizedJobData,
  status: "OPEN" | "CLOSED" | "REOPENED" = "OPEN"
): JobSnapshotPayload {
  return {
    title: job.title,
    companyName: job.company,
    location: job.location,
    workMode: job.workMode,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryText: job.salaryText,
    description: job.description,
    skills: job.skills,
    technologies: job.technologies,
    applicationUrl: job.canonicalUrl || job.applicationUrl,
    domain: job.domain,
    status,
    capturedAt: new Date().toISOString(),
  };
}
