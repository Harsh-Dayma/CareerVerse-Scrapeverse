import { describe, it, expect } from "vitest";
import { generateCanonicalId, generateContentHash } from "../lib/identity";
import { normalizeJob } from "../lib/normalizer";

describe("Job Canonical Identity & Deduplication", () => {
  it("generates idempotent canonical IDs for repeated identical scrapes", () => {
    const scrape1 = normalizeJob({
      title: "Backend Engineer",
      company: "OrbitLabs",
      location: "Hyderabad",
      application_url: "https://careers.example.com/orbitlabs/job-1?utm_source=jobboard",
    });

    const scrape2 = normalizeJob({
      title: "Backend Engineer",
      company: "OrbitLabs",
      location: "Hyderabad",
      application_url: "https://careers.example.com/orbitlabs/job-1?utm_medium=email#apply",
    });

    const id1 = generateCanonicalId(scrape1);
    const id2 = generateCanonicalId(scrape2);

    expect(id1).toBe(id2);
  });

  it("differentiates different jobs at the same company", () => {
    const jobA = normalizeJob({
      title: "Backend Engineer",
      company: "OrbitLabs",
      location: "Hyderabad",
      application_url: "https://careers.example.com/orbitlabs/job-1",
    });

    const jobB = normalizeJob({
      title: "Frontend Developer",
      company: "OrbitLabs",
      location: "Hyderabad",
      application_url: "https://careers.example.com/orbitlabs/job-2",
    });

    const idA = generateCanonicalId(jobA);
    const idB = generateCanonicalId(jobB);

    expect(idA).not.toBe(idB);
  });

  it("updates content hash when salary or requirements change", () => {
    const job1 = normalizeJob({
      title: "Backend Engineer",
      company: "OrbitLabs",
      location: "Hyderabad",
      salary_text: "₹10L–₹14L",
      description: "Build distributed storage.",
      skills: ["Python", "SQL"],
    });

    const job2 = normalizeJob({
      title: "Backend Engineer",
      company: "OrbitLabs",
      location: "Hyderabad",
      salary_text: "₹12L–₹16L", // Changed salary
      description: "Build distributed storage.",
      skills: ["Python", "SQL"],
    });

    const hash1 = generateContentHash(job1);
    const hash2 = generateContentHash(job2);

    expect(hash1).not.toBe(hash2);
  });
});
