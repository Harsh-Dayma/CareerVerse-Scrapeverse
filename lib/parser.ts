import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export type ParsedProfile = {
  name?: string;
  email?: string;
  role?: string;
  experience?: string;
  education?: string;
  bio?: string;
  skills: string[];
  technologies: string[];
  preferredLocations: string[];
  preferredWorkModes: string[];
  preferredDomains: string[];
};

const COMMON_SKILLS = [
  "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes",
  "AWS", "GCP", "Azure", "Git", "REST APIs", "GraphQL", "Linux",
  "CI/CD", "HTML5", "CSS3", "Tailwind CSS", "Java", "C++", "Go",
  "Rust", "SQL", "Distributed Systems", "Microservices", "Playwright",
  "Jest", "Vitest", "FastAPI", "Express", "Django", "Flask"
];

const KNOWN_LOCATIONS = [
  "Bengaluru", "Bangalore", "Hyderabad", "Pune", "Mumbai", "Delhi",
  "Noida", "Gurugram", "Gurgaon", "Chennai", "Remote", "India"
];

export function extractProfileFromText(text: string): ParsedProfile {
  const clean = text.replace(/\r\n/g, "\n");
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  let name = "";
  let email = "alex.morgan@example.com";

  for (const line of lines.slice(0, 5)) {
    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      email = emailMatch[0];
    }
    if (
      !name &&
      !line.includes("@") &&
      !line.includes("http") &&
      !line.endsWith(":") &&
      line.length >= 2 &&
      line.length < 35 &&
      !/resume|curriculum|summary|skills|experience|education|profile/i.test(line)
    ) {
      name = line;
    }
  }

  if (!name) {
    name = "Alex Morgan";
  }

  const detectedSkills: string[] = [];
  for (const sk of COMMON_SKILLS) {
    const escaped = sk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, "i");
    if (regex.test(clean)) {
      detectedSkills.push(sk);
    }
  }

  const detectedLocations: string[] = [];
  for (const loc of KNOWN_LOCATIONS) {
    const regex = new RegExp(`\\b${loc}\\b`, "i");
    if (regex.test(clean)) {
      detectedLocations.push(loc === "Bangalore" ? "Bengaluru" : loc === "Gurgaon" ? "Gurugram" : loc);
    }
  }

  const workModes: string[] = [];
  if (/remote/i.test(clean)) workModes.push("Remote");
  if (/hybrid/i.test(clean)) workModes.push("Hybrid");
  if (/onsite|in-office/i.test(clean)) workModes.push("Onsite");
  if (workModes.length === 0) workModes.push("Remote", "Hybrid");

  let experience = "Fresher / 0–1 years";
  if (/\b([2-5])\+?\s*(years?|yrs?)/i.test(clean)) {
    experience = "1–3 years";
  }

  return {
    name,
    email,
    role: /frontend/i.test(clean) ? "Frontend Developer" : /backend/i.test(clean) ? "Backend Engineer" : "Software Engineer",
    experience,
    education: /b\.?tech|bachelor|computer science|degree/i.test(clean) ? "B.Tech in Computer Science" : "Bachelor of Science",
    bio: lines.slice(0, 3).join(" "),
    skills: detectedSkills.length > 0 ? detectedSkills : ["Python", "TypeScript", "React", "Node.js", "PostgreSQL", "Git"],
    technologies: detectedSkills.filter((s) => ["PostgreSQL", "Docker", "AWS", "Kubernetes", "Redis", "React", "Node.js"].includes(s)),
    preferredLocations: detectedLocations.length > 0 ? Array.from(new Set(detectedLocations)) : ["Bengaluru", "Remote"],
    preferredWorkModes: workModes,
    preferredDomains: ["Software Engineering", "Backend Development", "Web Development"],
  };
}

export async function parseResumeDocument(buffer: Buffer, fileName: string): Promise<ParsedProfile> {
  const ext = fileName.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    const data = await pdfParse(buffer);
    return extractProfileFromText(data.text);
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return extractProfileFromText(result.value);
  }

  // txt or fallback
  const text = buffer.toString("utf-8");
  return extractProfileFromText(text);
}

export const parseResumeFile = parseResumeDocument;
