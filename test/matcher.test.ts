import { describe, it, expect } from "vitest";
import { calculateDeterministicMatch } from "../lib/matcher";

describe("Deterministic 7-Dimension Matching Engine", () => {
  const candidate = {
    id: 1,
    name: "Alex Morgan",
    role: "Computer Science Graduate",
    experience: "Fresher / 0–1 years",
    skills: ["Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Git", "Docker", "REST APIs", "SQL"],
    technologies: ["PostgreSQL", "Docker", "Node.js", "React", "Git"],
    preferredLocations: ["Bengaluru", "Hyderabad", "Remote"],
    preferredWorkModes: ["Remote", "Hybrid"],
    preferredDomains: ["Software Engineering", "Backend Development", "Web Development"],
  };

  it("calculates high match score for strong skill and location alignment", () => {
    const job = {
      title: "Junior Backend Engineer",
      companyName: "NovaStack",
      location: "Bengaluru",
      workMode: "Hybrid",
      experienceLevel: "Fresher / 0–1 years",
      skills: ["TypeScript", "Node.js", "PostgreSQL", "REST APIs", "Git"],
      technologies: ["PostgreSQL", "Node.js", "Git"],
      domain: "Backend Development",
    };

    const match = calculateDeterministicMatch(job, candidate);
    expect(match.overallScore).toBeGreaterThanOrEqual(88);
    expect(match.dimensionScores.skills).toBe(100);
    expect(match.dimensionScores.location).toBe(100);
    expect(match.dimensionScores.workMode).toBe(100);
    expect(match.strongMatches.length).toBeGreaterThan(0);
    expect(match.explanationList.length).toBe(7);
  });

  it("identifies requirement gaps when candidate lacks skills", () => {
    const job = {
      title: "AI ML Systems Engineer",
      companyName: "BlueOrbit AI",
      location: "Remote",
      workMode: "Remote",
      experienceLevel: "Mid-Level",
      skills: ["PyTorch", "TensorFlow", "CUDA", "Kubernetes"],
      technologies: ["Kubernetes", "CUDA"],
      domain: "AI & Machine Learning",
    };

    const match = calculateDeterministicMatch(job, candidate);
    expect(match.overallScore).toBeLessThan(75);
    expect(match.skillGaps).toContain("PyTorch");
    expect(match.skillGaps).toContain("TensorFlow");
  });

  it("transparently breaks down all 7 dimension scores without paid AI", () => {
    const job = {
      title: "Full Stack Engineer",
      companyName: "NexusWorks",
      location: "Mumbai",
      workMode: "Onsite",
      experienceLevel: "Fresher",
      skills: ["React", "Node.js", "PostgreSQL"],
      technologies: ["React", "PostgreSQL"],
      domain: "Software Engineering",
    };

    const match = calculateDeterministicMatch(job, candidate);
    const dimensions = match.explanationList.map((e) => e.label);

    expect(dimensions).toContain("Skills Match");
    expect(dimensions).toContain("Technology Stack");
    expect(dimensions).toContain("Role Alignment");
    expect(dimensions).toContain("Experience Level");
    expect(dimensions).toContain("Location");
    expect(dimensions).toContain("Work Mode");
    expect(dimensions).toContain("Domain & Industry");
  });
});
