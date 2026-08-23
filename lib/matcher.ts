export type MatchWeights = {
  skills: number;
  technologies: number;
  role: number;
  experience: number;
  location: number;
  workMode: number;
  domain: number;
};

export const DEFAULT_WEIGHTS: MatchWeights = {
  skills: 0.25,
  technologies: 0.20,
  role: 0.15,
  experience: 0.15,
  location: 0.10,
  workMode: 0.10,
  domain: 0.05,
};

export type CandidateProfile = {
  id?: number;
  name: string;
  role: string;
  experience: string;
  skills: string[];
  technologies?: string[];
  preferredLocations: string[];
  preferredWorkModes: string[];
  preferredDomains: string[];
  weightsConfig?: Partial<MatchWeights>;
};

export type JobToMatch = {
  id?: number;
  title: string;
  companyName: string;
  location: string;
  workMode: string;
  experienceLevel: string;
  skills: string[];
  technologies: string[];
  domain: string;
};

export type MatchResult = {
  overallScore: number;
  dimensionScores: {
    skills: number;
    technologies: number;
    role: number;
    experience: number;
    location: number;
    workMode: number;
    domain: number;
  };
  matchedSkills: string[];
  matchedTechnologies: string[];
  skillGaps: string[];
  strongMatches: string[];
  gaps: string[];
  whyMatch: string;
  explanationList: {
    label: string;
    score: number;
    weight: number;
    detail: string;
  }[];
};

function normalizeTokens(arr: string[]): string[] {
  return arr.map((s) => s.toLowerCase().trim()).filter(Boolean);
}

function matchArray(target: string[], candidate: string[]): { score: number; matched: string[]; missing: string[] } {
  if (target.length === 0) {
    return { score: 100, matched: [], missing: [] };
  }
  const candidateSet = new Set(normalizeTokens(candidate));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const item of target) {
    const norm = item.toLowerCase().trim();
    if (candidateSet.has(norm)) {
      matched.push(item);
    } else {
      // Fuzzy substring check (e.g. "React.js" vs "React")
      const found = Array.from(candidateSet).some((c) => c.includes(norm) || norm.includes(c));
      if (found) {
        matched.push(item);
      } else {
        missing.push(item);
      }
    }
  }

  const score = Math.round((matched.length / target.length) * 100);
  return { score, matched, missing };
}

function computeRoleScore(jobTitle: string, candidateRole: string): { score: number; detail: string } {
  const j = jobTitle.toLowerCase();
  const c = candidateRole.toLowerCase();

  if (j === c) return { score: 100, detail: "Exact role title alignment" };

  const jTokens = j.split(/\s+/);
  const cTokens = c.split(/\s+/);
  const overlap = jTokens.filter((t) => cTokens.includes(t) && t.length > 2);

  if (overlap.length >= 2 || j.includes(c) || c.includes(j)) {
    return { score: 95, detail: `Strong title match (${jobTitle})` };
  }

  if (overlap.length === 1) {
    return { score: 80, detail: `Partial role alignment (${overlap.join(", ")})` };
  }

  if (
    (j.includes("engineer") || j.includes("developer")) &&
    (c.includes("engineer") || c.includes("developer") || c.includes("student"))
  ) {
    return { score: 75, detail: "Software engineering domain relevance" };
  }

  return { score: 50, detail: `Different role focus (${jobTitle})` };
}

function computeExperienceScore(jobExp: string, candExp: string): { score: number; detail: string } {
  const j = jobExp.toLowerCase();
  const c = candExp.toLowerCase();

  if (j.includes("fresher") || j.includes("entry") || j.includes("intern") || j.includes("0-1") || j.includes("junior")) {
    if (c.includes("fresher") || c.includes("0-1") || c.includes("student") || c.includes("junior")) {
      return { score: 100, detail: "Perfect experience level for fresh graduates & juniors" };
    }
    return { score: 90, detail: "Entry level opening" };
  }

  if (j.includes("1-3") || j.includes("mid") || j.includes("associate")) {
    if (c.includes("fresher") || c.includes("0-1")) {
      return { score: 75, detail: "Junior to mid-level (1-3 yrs preferred)" };
    }
    return { score: 85, detail: "Mid-level opening" };
  }

  if (j.includes("senior") || j.includes("lead") || j.includes("5+")) {
    if (c.includes("fresher") || c.includes("student")) {
      return { score: 40, detail: "Senior experience required (5+ years)" };
    }
  }

  return { score: 70, detail: `Experience requirement: ${jobExp}` };
}

function computeLocationScore(jobLoc: string, candLocs: string[], jobWorkMode: string): { score: number; detail: string } {
  if (jobWorkMode.toLowerCase() === "remote") {
    return { score: 100, detail: "100% Remote flexibility" };
  }

  const normJobLoc = jobLoc.toLowerCase();
  const matchedLoc = candLocs.find((loc) => normJobLoc.includes(loc.toLowerCase()) || loc.toLowerCase().includes(normJobLoc));

  if (matchedLoc) {
    return { score: 100, detail: `Located in preferred city: ${jobLoc}` };
  }

  if (candLocs.some((l) => l.toLowerCase() === "remote")) {
    return { score: 75, detail: `Onsite/Hybrid in ${jobLoc}` };
  }

  return { score: 50, detail: `Location mismatch: ${jobLoc}` };
}

function computeWorkModeScore(jobMode: string, candModes: string[]): { score: number; detail: string } {
  const normJob = jobMode.toLowerCase();
  const candNorms = candModes.map((m) => m.toLowerCase());

  if (candNorms.includes(normJob)) {
    return { score: 100, detail: `Matches preferred work mode (${jobMode})` };
  }

  if (normJob === "hybrid" && candNorms.includes("remote")) {
    return { score: 75, detail: "Hybrid model with partial remote support" };
  }

  if (normJob === "onsite" && candNorms.includes("hybrid")) {
    return { score: 60, detail: "Onsite requirement" };
  }

  return { score: 50, detail: `Work mode: ${jobMode}` };
}

function computeDomainScore(jobDomain: string, candDomains: string[]): { score: number; detail: string } {
  const normJob = jobDomain.toLowerCase();
  const candNorms = candDomains.map((d) => d.toLowerCase());

  if (candNorms.some((d) => normJob.includes(d) || d.includes(normJob))) {
    return { score: 100, detail: `Strong domain alignment (${jobDomain})` };
  }

  return { score: 65, detail: `Domain: ${jobDomain}` };
}

export function calculateDeterministicMatch(
  job: JobToMatch,
  candidate: CandidateProfile,
  customWeights?: Partial<MatchWeights>
): MatchResult {
  const weights: MatchWeights = {
    ...DEFAULT_WEIGHTS,
    ...(candidate.weightsConfig || {}),
    ...(customWeights || {}),
  };

  const totalWeight =
    weights.skills +
    weights.technologies +
    weights.role +
    weights.experience +
    weights.location +
    weights.workMode +
    weights.domain;

  const candTech = candidate.technologies && candidate.technologies.length > 0 ? candidate.technologies : candidate.skills;

  const skillsMatch = matchArray(job.skills, candidate.skills);
  const techMatch = matchArray(job.technologies, candTech);
  const roleMatch = computeRoleScore(job.title, candidate.role);
  const expMatch = computeExperienceScore(job.experienceLevel, candidate.experience);
  const locMatch = computeLocationScore(job.location, candidate.preferredLocations, job.workMode);
  const modeMatch = computeWorkModeScore(job.workMode, candidate.preferredWorkModes);
  const domainMatch = computeDomainScore(job.domain, candidate.preferredDomains);

  const weightedSum =
    skillsMatch.score * weights.skills +
    techMatch.score * weights.technologies +
    roleMatch.score * weights.role +
    expMatch.score * weights.experience +
    locMatch.score * weights.location +
    modeMatch.score * weights.workMode +
    domainMatch.score * weights.domain;

  const overallScore = Math.round((weightedSum / totalWeight) * 10) / 10;

  const strongMatches: string[] = [];
  const gaps: string[] = [];

  skillsMatch.matched.slice(0, 4).forEach((s) => strongMatches.push(`Skill: ${s}`));
  techMatch.matched.slice(0, 3).forEach((t) => strongMatches.push(`Tech: ${t}`));

  if (roleMatch.score >= 90) strongMatches.push(`Role: ${job.title}`);
  if (locMatch.score === 100) strongMatches.push(`Location: ${job.location}`);
  if (modeMatch.score === 100) strongMatches.push(`Mode: ${job.workMode}`);

  skillsMatch.missing.slice(0, 3).forEach((s) => gaps.push(`Missing skill: ${s}`));
  techMatch.missing.slice(0, 2).forEach((t) => gaps.push(`Tech gap: ${t}`));
  if (expMatch.score < 70) gaps.push(`Experience gap: ${job.experienceLevel} required`);
  if (locMatch.score < 70) gaps.push(`Location: ${job.location} (not in primary preference)`);

  const whyMatch = `Matched ${skillsMatch.matched.length}/${job.skills.length || 1} required skills and aligns with your ${candidate.role} background.`;

  return {
    overallScore: Math.min(100, Math.max(0, Math.round(overallScore))),
    dimensionScores: {
      skills: skillsMatch.score,
      technologies: techMatch.score,
      role: roleMatch.score,
      experience: expMatch.score,
      location: locMatch.score,
      workMode: modeMatch.score,
      domain: domainMatch.score,
    },
    matchedSkills: skillsMatch.matched,
    matchedTechnologies: techMatch.matched,
    skillGaps: skillsMatch.missing,
    strongMatches,
    gaps,
    whyMatch,
    explanationList: [
      { label: "Skills Match", score: skillsMatch.score, weight: weights.skills, detail: `${skillsMatch.matched.length}/${job.skills.length || 1} skills matched` },
      { label: "Technology Stack", score: techMatch.score, weight: weights.technologies, detail: `${techMatch.matched.length}/${job.technologies.length || 1} technologies matched` },
      { label: "Role Alignment", score: roleMatch.score, weight: weights.role, detail: roleMatch.detail },
      { label: "Experience Level", score: expMatch.score, weight: weights.experience, detail: expMatch.detail },
      { label: "Location", score: locMatch.score, weight: weights.location, detail: locMatch.detail },
      { label: "Work Mode", score: modeMatch.score, weight: weights.workMode, detail: modeMatch.detail },
      { label: "Domain & Industry", score: domainMatch.score, weight: weights.domain, detail: domainMatch.detail },
    ],
  };
}
