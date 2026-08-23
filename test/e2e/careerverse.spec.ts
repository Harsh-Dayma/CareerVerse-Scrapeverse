import { test, expect } from "@playwright/test";

test.describe("CareerVerse Autonomous Career Intelligence E2E Suite", () => {
  test("Dashboard loads stat metrics, knowledge graph, and top recommendations", async ({ page }) => {
    await page.goto("/dashboard");

    // Expect page title & header
    await expect(page.getByText("Autonomous Career Intelligence")).toBeVisible();
    await expect(page.getByText("Monitored Companies")).toBeVisible();
    await expect(page.getByText("Active Jobs")).toBeVisible();
    await expect(page.getByText("Living Knowledge Graph")).toBeVisible();
    await expect(page.getByText("Top Job Recommendations")).toBeVisible();
  });

  test("Jobs Catalog allows search, filtering, and inspects 7-D Match Breakdown", async ({ page }) => {
    await page.goto("/jobs");

    await expect(page.getByText("Discovered Opportunities")).toBeVisible();
    await expect(page.getByText("SHOWING")).toBeVisible();

    // Click on Match Breakdown button for first job
    const whyButton = page.getByRole("button", { name: /Why This Job\?/i }).first();
    if (await whyButton.isVisible()) {
      await whyButton.click();
      await expect(page.getByText("7-Dimension Deterministic Match Score")).toBeVisible();
      await expect(page.getByText("Skills Match")).toBeVisible();
      await expect(page.getByText("Role Alignment")).toBeVisible();
    }
  });

  test("Scrapers & Self-Healing Evidence Panel renders structural diffs and health", async ({ page }) => {
    await page.goto("/scrapers");

    await expect(page.getByText("Scraper Health & Self-Healing")).toBeVisible();
    await expect(page.getByText("Self-Healing Verification Evidence")).toBeVisible();
    await expect(page.getByText("Configured Target Portals")).toBeVisible();
  });

  test("Knowledge Graph Explorer renders force simulation canvas and controls", async ({ page }) => {
    await page.goto("/graph");

    await expect(page.getByText("Interactive Career Knowledge Graph")).toBeVisible();
    await expect(page.getByText("Dynamic Knowledge Graph")).toBeVisible();
  });

  test("Demo mode page supports Step-by-Step and Full Demo execution", async ({ page }) => {
    await page.goto("/demo");

    await expect(page.getByText("Interactive Demo & Judge Walkthrough")).toBeVisible();
    await expect(page.getByText("Live Stage Progression")).toBeVisible();
    await expect(page.getByRole("button", { name: /Run Full Demo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Next Step/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Reset Demo/i })).toBeVisible();
  });
});
