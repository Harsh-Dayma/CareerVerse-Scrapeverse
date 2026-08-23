import { describe, it, expect } from "vitest";
import { detectStructuralDegradation, validateRepairedPayload } from "../lib/scraper/healing";

describe("Scraper Structural Degradation & Self-Healing Validator", () => {
  it("detects DOM markup drift when required fields disappear", () => {
    const previous = {
      title: "Senior Distributed Systems Engineer",
      company: "QuantumForge",
      location: "Bengaluru",
      application_url: "https://careers.example.com/quantumforge/101",
      salary: "₹14L–₹22L",
    };

    const degradedBatch = [
      {
        title: "Senior Distributed Systems Engineer",
        company: "QuantumForge",
        location: "Bengaluru",
        // missing application_url
        // missing salary
      },
    ];

    const anomaly = detectStructuralDegradation(previous, degradedBatch);
    expect(anomaly.hasAnomaly).toBe(true);
    expect(anomaly.failureType).toBe("STRUCTURAL_DEGRADATION");
    expect(anomaly.missingRequiredFields).toContain("application_url");
    expect(anomaly.droppedFields).toContain("application_url");
  });

  it("validates repaired candidate payload with 100% score", () => {
    const repairedBatch = [
      {
        title: "Distributed Systems Engineer",
        company: "QuantumForge",
        location: "Bengaluru",
        application_url: "https://careers.example.com/quantumforge/101",
      },
      {
        title: "Junior Cloud Engineer",
        company: "QuantumForge",
        location: "Remote",
        application_url: "https://careers.example.com/quantumforge/102",
      },
    ];

    const validation = validateRepairedPayload(repairedBatch);
    expect(validation.isValid).toBe(true);
    expect(validation.validationScore).toBe(100);
    expect(validation.validCount).toBe(2);
  });

  it("rejects invalid repair candidate with missing selectors", () => {
    const invalidBatch = [
      {
        title: "Distributed Systems Engineer",
        // missing company and url
      },
    ];

    const validation = validateRepairedPayload(invalidBatch);
    expect(validation.isValid).toBe(false);
    expect(validation.validationScore).toBe(0);
  });
});
