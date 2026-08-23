import { describe, it, expect } from "vitest";
import { cleanUrl, normalizeJob, parseWorkMode } from "../lib/normalizer";

describe("URL Normalizer & Cleaner", () => {
  it("strips tracking query parameters while preserving critical parameters", () => {
    const dirty = "https://careers.example.com/job/123?utm_source=linkedin&utm_medium=cpc&utm_campaign=hiring&ref=feed#apply-now";
    const cleaned = cleanUrl(dirty);
    expect(cleaned).toBe("https://careers.example.com/job/123");
  });

  it("removes trailing slashes on non-root paths", () => {
    const url = "https://careers.example.com/roles/backend-engineer/";
    const cleaned = cleanUrl(url);
    expect(cleaned).toBe("https://careers.example.com/roles/backend-engineer");
  });

  it("handles fragments correctly", () => {
    const url = "https://careers.example.com/roles/devops#requirements";
    const cleaned = cleanUrl(url);
    expect(cleaned).toBe("https://careers.example.com/roles/devops");
  });
});

describe("Work Mode Parser", () => {
  it("identifies remote from work mode or location", () => {
    expect(parseWorkMode("Remote")).toBe("Remote");
    expect(parseWorkMode("Full-time", "Remote - India")).toBe("Remote");
    expect(parseWorkMode("WFH")).toBe("Remote");
  });

  it("identifies hybrid work mode", () => {
    expect(parseWorkMode("Hybrid")).toBe("Hybrid");
    expect(parseWorkMode("Flexible", "Bengaluru")).toBe("Hybrid");
  });

  it("defaults to onsite for non-remote locations", () => {
    expect(parseWorkMode("Full-time", "Bengaluru Office")).toBe("Onsite");
  });
});

describe("Job Normalizer", () => {
  it("normalizes a raw scraped job into clean structured data", () => {
    const raw = {
      title: "  Senior Software Engineer   ",
      company_name: "NovaStack",
      location: "Bengaluru, India",
      work_mode: "Hybrid",
      salary: "₹15L–₹22L",
      salary_min: 1500000,
      salary_max: 2200000,
      description: "Build robust APIs.",
      skills: "Python, Docker, PostgreSQL",
      application_url: "https://careers.example.com/novastack/101?utm_source=twitter",
    };

    const norm = normalizeJob(raw);
    expect(norm.title).toBe("Senior Software Engineer");
    expect(norm.company).toBe("NovaStack");
    expect(norm.location).toBe("Bengaluru, India");
    expect(norm.workMode).toBe("Hybrid");
    expect(norm.salaryMin).toBe(1500000);
    expect(norm.salaryMax).toBe(2200000);
    expect(norm.skills).toEqual(["Python", "Docker", "PostgreSQL"]);
    expect(norm.canonicalUrl).toBe("https://careers.example.com/novastack/101");
  });
});
