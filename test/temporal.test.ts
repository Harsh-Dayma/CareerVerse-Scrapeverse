import { describe, it, expect } from "vitest";
import { compareJobSnapshots, buildSnapshotPayload } from "../lib/temporal";
import { normalizeJob } from "../lib/normalizer";

describe("Temporal History & Snapshot Engine", () => {
  it("detects creation of new job", () => {
    const job = normalizeJob({
      title: "Backend Engineer",
      company: "NovaStack",
      location: "Bengaluru",
      salary: "₹10L–₹15L",
    });

    const diffs = compareJobSnapshots(null, job, "OPEN");
    expect(diffs).toHaveLength(1);
    expect(diffs[0].changeType).toBe("CREATED");
    expect(diffs[0].newValue).toBe("OPEN");
  });

  it("detects salary change", () => {
    const prevJob = normalizeJob({
      title: "Backend Engineer",
      company: "NovaStack",
      location: "Bengaluru",
      salary_text: "₹8L–₹12L",
      skills: ["Python", "SQL"],
    });

    const prevSnap = buildSnapshotPayload(prevJob, "OPEN");

    const currentJob = normalizeJob({
      title: "Backend Engineer",
      company: "NovaStack",
      location: "Bengaluru",
      salary_text: "₹10L–₹15L", // Changed
      skills: ["Python", "SQL"],
    });

    const diffs = compareJobSnapshots(prevSnap, currentJob, "OPEN");
    const salaryDiff = diffs.find((d) => d.fieldName === "salary");

    expect(salaryDiff).toBeDefined();
    expect(salaryDiff?.oldValue).toBe("₹8L–₹12L");
    expect(salaryDiff?.newValue).toBe("₹10L–₹15L");
    expect(salaryDiff?.changeType).toBe("UPDATED");
  });

  it("detects skill additions and removals", () => {
    const prevJob = normalizeJob({
      title: "Full Stack Engineer",
      company: "PixelGrid",
      location: "Bengaluru",
      skills: ["React", "JavaScript"],
    });

    const prevSnap = buildSnapshotPayload(prevJob, "OPEN");

    const currentJob = normalizeJob({
      title: "Full Stack Engineer",
      company: "PixelGrid",
      location: "Bengaluru",
      skills: ["React", "TypeScript", "Next.js"], // Added TypeScript, Next.js; removed JavaScript
    });

    const diffs = compareJobSnapshots(prevSnap, currentJob, "OPEN");
    const addedDiff = diffs.find((d) => d.fieldName === "skills_added");
    const removedDiff = diffs.find((d) => d.fieldName === "skills_removed");

    expect(addedDiff?.newValue).toContain("TypeScript");
    expect(removedDiff?.oldValue).toContain("JavaScript");
  });

  it("detects status transition when job is closed or reopened", () => {
    const job = normalizeJob({
      title: "Security Engineer",
      company: "CyberNest",
      location: "Chennai",
    });

    const openSnap = buildSnapshotPayload(job, "OPEN");
    const closeDiffs = compareJobSnapshots(openSnap, job, "CLOSED");

    expect(closeDiffs.find((d) => d.changeType === "CLOSED")).toBeDefined();
  });
});
