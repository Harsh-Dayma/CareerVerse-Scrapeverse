import { describe, it, expect } from "vitest";
import { extractProfileFromText } from "../lib/parser";

describe("Local Resume Parser", () => {
  it("extracts skills, experience, and roles from raw resume text", () => {
    const text = `
      Alex Morgan
      Email: alex@example.com | Bengaluru, India
      
      Summary:
      B.Tech Computer Science graduate passionate about backend development.
      
      Skills:
      Python, TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, Git, REST APIs, Linux
      
      Experience:
      Fresher / 0-1 years building full stack web applications.
      
      Preferences:
      Looking for Remote or Hybrid software engineer positions in Bengaluru or Hyderabad.
    `;

    const profile = extractProfileFromText(text);
    expect(profile.name).toBe("Alex Morgan");
    expect(profile.skills).toContain("Python");
    expect(profile.skills).toContain("TypeScript");
    expect(profile.skills).toContain("PostgreSQL");
    expect(profile.skills).toContain("Docker");
    expect(profile.preferredLocations).toContain("Bengaluru");
    expect(profile.preferredWorkModes).toContain("Remote");
  });

  it("handles malformed or empty text gracefully without throwing errors", () => {
    const profile = extractProfileFromText("");
    expect(profile.skills.length).toBeGreaterThan(0);
    expect(profile.name).toBeDefined();
  });
});
