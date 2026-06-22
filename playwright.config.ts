import { defineConfig, devices } from "@playwright/test";

// Automated E2E recording + validation harness (replaces the manual browser-MCP
// recordings; supersedes the original "no Playwright / browser-MCP only" decision
// in TC-STACK-05 — see ADR-0006). Runs a headless background Chromium (its own
// browser, never the user's), drives each capability flow, ASSERTS the FR-tied
// conditions (the assertions ARE the requirement validation), and records a video
// per flow. The JSON report is the machine-readable source for the recordings
// manifest (scripts/build-recordings-manifest.mjs) and the gate
// (scripts/check-recordings.mjs).
//
// Server: reuses the already-running production server on :3100 if present,
// otherwise starts `next start -p 3100` (a prod build must exist).

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./evals/results/e2e-artifacts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [
    ["json", { outputFile: "evals/results/e2e-report.json" }],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:3100",
    headless: true,
    viewport: { width: 1280, height: 800 },
    video: "on",
    trace: "retain-on-failure",
    locale: "uk-UA",
    timezoneId: "Europe/Kyiv",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
