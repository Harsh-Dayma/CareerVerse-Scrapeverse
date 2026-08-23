import { ScraperAdapter, ScraperExtractionResult } from "./adapter";
import { RawScrapedJob } from "../normalizer";

export type MockScraperScenario = "HEALTHY" | "DEGRADED" | "RECOVERED";

export class MockBrightDataAdapter implements ScraperAdapter {
  private scenario: MockScraperScenario;

  constructor(scenario: MockScraperScenario = "HEALTHY") {
    this.scenario = scenario;
  }

  setScenario(scenario: MockScraperScenario) {
    this.scenario = scenario;
  }

  async scrapeCareerPage(url: string, collectorId: string = "mock_collector_default"): Promise<ScraperExtractionResult> {
    if (this.scenario === "DEGRADED" || collectorId.includes("degraded")) {
      // Degraded scenario: markup broke, application_url & salary are missing
      const rawJobs: RawScrapedJob[] = [
        {
          title: "Senior Distributed Systems Engineer",
          company: "QuantumForge",
          location: "Bengaluru",
          work_mode: "Hybrid",
          description: "Build ultra-low latency compute clusters.",
          skills: "Rust, C++, Linux",
          // Missing application_url!
          // Missing salary!
        },
        {
          title: "Cloud Infrastructure Architect",
          company: "QuantumForge",
          location: "Remote",
          work_mode: "Remote",
          description: "Design fault-tolerant cloud architecture.",
          skills: "Kubernetes, AWS, Terraform",
          // Missing application_url!
        },
      ];

      return {
        success: false,
        rawJobs,
        extractionScore: 18,
        validCount: 0,
        invalidCount: 2,
        missingFields: ["application_url", "salary"],
        errorMessage: "Structural degradation detected: application_url anchor selector failed on page markup.",
        metadata: { scenario: "DEGRADED", collectorId, simulatedDrift: true },
      };
    }

    if (this.scenario === "RECOVERED" || collectorId.includes("recovered")) {
      // Recovered scenario: healed selector extracts fully valid jobs
      const rawJobs: RawScrapedJob[] = [
        {
          job_id: "qf-rec-101",
          title: "Distributed Systems Software Engineer",
          company: "QuantumForge",
          location: "Bengaluru",
          work_mode: "Hybrid",
          employment_type: "Full-time",
          salary_min: 1400000,
          salary_max: 2200000,
          salary_currency: "INR",
          salary_text: "₹14L–₹22L",
          description: "High-performance distributed systems engineering and concurrent message routing.",
          requirements: "Proficiency in Python, Go, Rust, PostgreSQL, and Linux kernel internals.",
          experience_level: "Fresher / 0–2 years",
          skills: ["Python", "Rust", "Linux", "PostgreSQL", "Distributed Systems"],
          technologies: ["PostgreSQL", "Docker", "Linux", "Git"],
          application_url: "https://careers.example.com/quantumforge/jobs/qf-rec-101",
          domain: "Software Engineering",
        },
        {
          job_id: "qf-rec-102",
          title: "Junior Cloud & Platform Engineer",
          company: "QuantumForge",
          location: "Remote",
          work_mode: "Remote",
          employment_type: "Full-time",
          salary_min: 1000000,
          salary_max: 1600000,
          salary_currency: "INR",
          salary_text: "₹10L–₹16L",
          description: "Automate containerized workloads and CI/CD pipelines.",
          requirements: "Experience with Docker, Kubernetes, AWS, and Git.",
          experience_level: "Fresher / 0–1 years",
          skills: ["Docker", "Kubernetes", "AWS", "Python", "Git", "Linux"],
          technologies: ["Docker", "Kubernetes", "AWS", "Git"],
          application_url: "https://careers.example.com/quantumforge/jobs/qf-rec-102",
          domain: "Cloud & DevOps",
        },
        {
          job_id: "qf-rec-103",
          title: "Full Stack Engineer (AI Platform)",
          company: "QuantumForge",
          location: "Hyderabad",
          work_mode: "Hybrid",
          employment_type: "Full-time",
          salary_min: 1200000,
          salary_max: 1800000,
          salary_currency: "INR",
          salary_text: "₹12L–₹18L",
          description: "Develop intuitive UI components and REST APIs for compute cluster telemetry.",
          requirements: "Strong React, TypeScript, Next.js, and Node.js skills.",
          experience_level: "Fresher / 0–1 years",
          skills: ["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL", "REST APIs"],
          technologies: ["React", "Next.js", "Node.js", "PostgreSQL"],
          application_url: "https://careers.example.com/quantumforge/jobs/qf-rec-103",
          domain: "Web Development",
        },
      ];

      return {
        success: true,
        rawJobs,
        extractionScore: 100,
        validCount: 3,
        invalidCount: 0,
        missingFields: [],
        metadata: { scenario: "RECOVERED", collectorId, healedSelectors: [".job-card > a[href]", ".salary-badge"] },
      };
    }

    // Default Healthy scenario
    const rawJobs: RawScrapedJob[] = [
      {
        job_id: "demo-nova-01",
        title: "Junior Backend Engineer",
        company: "NovaStack Technologies",
        location: "Bengaluru",
        work_mode: "Hybrid",
        employment_type: "Full-time",
        salary_min: 900000,
        salary_max: 1500000,
        salary_currency: "INR",
        salary_text: "₹9L–₹15L",
        description: "Build robust REST APIs, microservices, and database schemas with Node.js and PostgreSQL.",
        requirements: "Solid foundation in TypeScript, Node.js, SQL, and Git.",
        experience_level: "Fresher / 0–1 years",
        skills: ["TypeScript", "Node.js", "PostgreSQL", "REST APIs", "Git", "Docker"],
        technologies: ["PostgreSQL", "Docker", "Git", "Node.js"],
        application_url: "https://careers.example.com/novastack/jobs/backend-01",
        domain: "Backend Development",
      },
      {
        job_id: "demo-nova-02",
        title: "Frontend Developer (React / Next.js)",
        company: "NovaStack Technologies",
        location: "Remote",
        work_mode: "Remote",
        employment_type: "Full-time",
        salary_min: 800000,
        salary_max: 1400000,
        salary_currency: "INR",
        salary_text: "₹8L–₹14L",
        description: "Craft performant, responsive web applications using React, Next.js, and TypeScript.",
        requirements: "Experience with React, Next.js, CSS Modules, and state management.",
        experience_level: "Fresher / 0–1 years",
        skills: ["React", "Next.js", "TypeScript", "JavaScript", "REST APIs", "Git"],
        technologies: ["React", "Next.js", "TypeScript", "Git"],
        application_url: "https://careers.example.com/novastack/jobs/frontend-02",
        domain: "Frontend Development",
      },
    ];

    return {
      success: true,
      rawJobs,
      extractionScore: 98,
      validCount: 2,
      invalidCount: 0,
      missingFields: [],
      metadata: { scenario: "HEALTHY", collectorId },
    };
  }
}
