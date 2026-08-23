import { ScraperAdapter, ScraperExtractionResult } from "./adapter";
import { RawScrapedJob } from "../normalizer";

const API_BASE = "https://api.brightdata.com";

function getConfig() {
  const token = process.env.BRIGHT_DATA_API_TOKEN;
  const collector = process.env.BRIGHT_DATA_COLLECTOR_ID;

  if (!token) {
    throw new Error("Missing BRIGHT_DATA_API_TOKEN in environment");
  }

  return { token, defaultCollector: collector || "" };
}

export class LiveBrightDataAdapter implements ScraperAdapter {
  private customToken?: string;
  private customCollector?: string;

  constructor(config?: { apiToken?: string; collectorId?: string }) {
    if (config) {
      this.customToken = config.apiToken;
      this.customCollector = config.collectorId;
    }
  }

  async scrapeCareerPage(url: string, collectorId?: string): Promise<ScraperExtractionResult> {
    const token = this.customToken || process.env.BRIGHT_DATA_API_TOKEN;
    const defaultCollector = this.customCollector || process.env.BRIGHT_DATA_COLLECTOR_ID || "";

    if (!token) {
      throw new Error("Missing BRIGHT_DATA_API_TOKEN in environment");
    }

    const activeCollector = collectorId || defaultCollector;

    if (!activeCollector) {
      throw new Error("No Bright Data Collector ID provided");
    }

    try {
      // 1. Trigger Scraper Studio Collector
      const triggerRes = await fetch(
        `${API_BASE}/dca/trigger?collector=${encodeURIComponent(activeCollector)}&queue_next=1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ url }]),
          cache: "no-store",
        }
      );

      if (!triggerRes.ok) {
        const errText = await triggerRes.text();
        return {
          success: false,
          rawJobs: [],
          extractionScore: 0,
          validCount: 0,
          invalidCount: 0,
          missingFields: ["all"],
          errorMessage: `Trigger failed (${triggerRes.status}): ${errText}`,
        };
      }

      const triggerData = (await triggerRes.json()) as { collection_id: string };
      const snapshotId = triggerData.collection_id;

      // 2. Poll for snapshot completion (bounded timeout: 30s)
      let dataset: any = null;
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const dataRes = await fetch(
          `${API_BASE}/dca/dataset?id=${encodeURIComponent(snapshotId)}&collector=${encodeURIComponent(activeCollector)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );

        if (dataRes.ok) {
          const json = await dataRes.json();
          if (Array.isArray(json)) {
            dataset = json;
            break;
          }
        }
      }

      if (!Array.isArray(dataset)) {
        return {
          success: false,
          rawJobs: [],
          extractionScore: 0,
          validCount: 0,
          invalidCount: 0,
          missingFields: [],
          errorMessage: "Bright Data dataset collection timed out or is still processing in cloud.",
          metadata: { snapshotId },
        };
      }

      const rawJobs: RawScrapedJob[] = dataset;
      let validCount = 0;
      let invalidCount = 0;
      const missingFieldsSet = new Set<string>();

      for (const item of rawJobs) {
        const hasTitle = Boolean(item.title);
        const hasUrl = Boolean(item.application_url || item.applicationUrl || item.url);
        const hasCompany = Boolean(item.company || item.company_name);

        if (!hasTitle) missingFieldsSet.add("title");
        if (!hasUrl) missingFieldsSet.add("application_url");
        if (!hasCompany) missingFieldsSet.add("company");

        if (hasTitle && hasUrl && hasCompany) {
          validCount++;
        } else {
          invalidCount++;
        }
      }

      const total = validCount + invalidCount;
      const extractionScore = total > 0 ? Math.round((validCount / total) * 100) : 0;

      return {
        success: extractionScore >= 60,
        rawJobs,
        extractionScore,
        validCount,
        invalidCount,
        missingFields: Array.from(missingFieldsSet),
        metadata: { snapshotId, totalExtracted: total },
      };
    } catch (err: any) {
      return {
        success: false,
        rawJobs: [],
        extractionScore: 0,
        validCount: 0,
        invalidCount: 0,
        missingFields: ["network_error"],
        errorMessage: err.message || "Scraper request failed",
      };
    }
  }
}
