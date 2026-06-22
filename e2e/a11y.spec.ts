import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Automated accessibility + color-contrast gate (NFR-A11Y-01/02). This is the
// check my earlier approach lacked: it MEASURES rendered contrast (WCAG AA) and
// flags serious/critical a11y issues across the key states in both themes, so
// "colors are not readable" defects fail the gate instead of shipping. Runs as
// part of `npm run test:e2e`.

const KYIV = "/?lat=50.4547&lon=30.5238&name=" + encodeURIComponent("Київ");
const PAGES = [
  { name: "empty", url: "/" },
  { name: "forecast", url: KYIV },
];
const SCHEMES = ["light", "dark"] as const;

for (const scheme of SCHEMES) {
  for (const p of PAGES) {
    test(`a11y-${p.name}-${scheme} @NFR-A11Y-01 @NFR-A11Y-02`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(p.url, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (p.name === "forecast") {
        await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 20_000 });
      }
      // Let async content (map tiles, chart) fully settle so axe measures the
      // final rendered state, not a mid-transition frame.
      await page.waitForTimeout(2500);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const contrast = results.violations.filter((v) => v.id === "color-contrast");
      const serious = results.violations.filter(
        (v) => v.id !== "color-contrast" && (v.impact === "serious" || v.impact === "critical"),
      );

      for (const v of [...contrast, ...serious]) {
        for (const n of v.nodes) {
          console.log(`[${scheme}/${p.name}] ${v.id}: ${n.target} :: ${(n.failureSummary ?? "").replace(/\s+/g, " ").trim()}`);
        }
      }

      expect(contrast, `color-contrast violations (${scheme}/${p.name})`).toEqual([]);
      expect(serious, `serious/critical a11y violations (${scheme}/${p.name})`).toEqual([]);
    });
  }
}
