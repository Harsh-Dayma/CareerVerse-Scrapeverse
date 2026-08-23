import { RawScrapedJob } from "../normalizer";

export type ScraperExtractionResult = {
  success: boolean;
  rawJobs: RawScrapedJob[];
  extractionScore: number;
  validCount: number;
  invalidCount: number;
  missingFields: string[];
  errorMessage?: string;
  metadata?: Record<string, any>;
};

export interface ScraperAdapter {
  scrapeCareerPage(url: string, collectorId: string): Promise<ScraperExtractionResult>;
}
