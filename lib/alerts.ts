import { getDb, alerts } from "./db";
import { eq, desc } from "drizzle-orm";

export type AlertType =
  | "NEW_JOB"
  | "JOB_UPDATED"
  | "JOB_CLOSING"
  | "DEADLINE_APPROACHING"
  | "SCRAPER_FAILED"
  | "SCRAPER_HEALING"
  | "SCRAPER_RECOVERED";

export type AlertSeverity = "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";

export async function createAlert(input: {
  candidateId: number;
  type: AlertType;
  title: string;
  message: string;
  severity?: AlertSeverity;
  relatedJobId?: number;
  relatedScraperId?: number;
}) {
  const db = getDb();
  return await db.insert(alerts).values({
    candidateId: input.candidateId,
    type: input.type,
    title: input.title,
    message: input.message,
    severity: input.severity || "INFO",
    relatedJobId: input.relatedJobId,
    relatedScraperId: input.relatedScraperId,
    read: false,
  }).returning();
}

export async function getAlerts(candidateId: number = 1, limit: number = 50) {
  const db = getDb();
  return await db
    .select()
    .from(alerts)
    .where(eq(alerts.candidateId, candidateId))
    .orderBy(desc(alerts.createdAt))
    .limit(limit);
}

export const getCandidateAlerts = getAlerts;

export async function markAlertRead(alertId: number) {
  const db = getDb();
  return await db
    .update(alerts)
    .set({ read: true })
    .where(eq(alerts.id, alertId))
    .returning();
}
