import { test as base, expect, type Page } from "@playwright/test";

// Expected user-visible strings, mirrored from lib/i18n/uk.ts. Inlined (not
// imported) so the E2E harness has no dependency on the app's module-resolution
// config — an E2E suite legitimately asserts the literal text a user sees. If a
// string changes in uk.ts, update it here too (a deliberately small, visible set).
const t = {
  appName: "Погода",
  heroTitle: "Дізнайтеся погоду у будь-якому місті",
  searchLabel: "Пошук міста",
  searchSuggestionsLabel: "Підказки міст",
  searchNothingFound: "Нічого не знайдено. Спробуйте іншу назву.",
  searchUseMyLocation: "Моє місцезнаходження",
  themeToggleLabel: "Перемкнути тему",
  themeDarkLabel: "Темна тема",
  themeLightLabel: "Світла тема",
  comfortBandGreenLabel: "сприятливо",
  comfortBandYellowLabel: "помірно",
  comfortBandRedLabel: "несприятливо",
  comfortWeekendTitle: "Комфорт на вихідні",
  sunriseLabel: "Схід сонця",
  sunsetLabel: "Захід сонця",
  mapAttribution: "© OpenStreetMap contributors",
  comparePinCurrent: "Закріпити це місто",
  compareUnpinAction: "Прибрати",
  compareToggleLabel: "Порівняти вихідні",
  compareMakeActiveAction: "Зробити активним",
  compareSaturdayLabel: "Субота",
  compareSundayLabel: "Неділя",
} as const;

// Automated E2E recordings + requirement validation (ADR-0006). Each test below
// is one demo clip: it drives a real user flow in a headless background Chromium,
// records a video, and ASSERTS the conditions of the FRs named in its title
// (@FR-...). A clip "passes" only if its requirement assertions pass — recording
// and validation are the same step. scripts/build-recordings-manifest.mjs turns
// the JSON report into docs/qa/demo-recordings/manifest.json; the gate
// (scripts/check-recordings.mjs) guards that every clip validated and covers the
// browser-only FR set.
//
// NFR-OBS-01 (silent console) is enforced for every clip by the fixture below.

const KYIV = `/?lat=50.4547&lon=30.5238&name=${encodeURIComponent("Київ")}`;
const LVIV = `/?lat=49.8397&lon=24.0297&name=${encodeURIComponent("Львів")}`;

type Fixtures = { consoleGuard: string[] };

const test = base.extend<Fixtures>({
  consoleGuard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error" || m.type() === "warning") {
          const text = m.text();
          if (/favicon/i.test(text)) return; // benign
          problems.push(`[${m.type()}] ${text}`);
        }
      });
      page.on("pageerror", (e) => problems.push(`[pageerror] ${e.message}`));
      await use(problems);
    },
    { auto: true },
  ],
});

const FRAMES_DIR = "docs/qa/demo-recordings/frames";

// Capture the full-page proof still at the clip's PROOF moment (called explicitly
// per clip, not in afterEach — the proof content is sometimes mid-flow or below
// the fold, e.g. the suggestions list or the compare table). Full page so the
// vision verifier sees all of the proof, not just the viewport top.
async function proof(page: Page, id: string) {
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${FRAMES_DIR}/${id}.png`, fullPage: true });
}

// After every clip: settle (also lengthens the video so async content like map
// tiles is visibly rendered) and assert the console stayed silent (NFR-OBS-01).
test.afterEach(async ({ page, consoleGuard }) => {
  await page.waitForTimeout(1500);
  expect(consoleGuard, "console must stay silent (NFR-OBS-01)").toEqual([]);
});

async function gotoForecast(page: Page, url = KYIV) {
  await page.goto(url, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // The map is client-only/lazy; wait for the container and let tiles paint so
  // the recording + proof still show a fully rendered map (not a half-loaded one).
  await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
}

test("clip-empty-state @FR-SHELL-01 @FR-SHELL-03 @FR-CLOCK-01 @NFR-OBS-01", async ({ page }) => {
  await page.goto("/");
  const banner = page.getByRole("banner");
  await expect(banner.getByText(t.appName, { exact: true })).toBeVisible();
  // Live clock in the header (FR-CLOCK-01).
  await expect(banner.getByText(/\d{1,2}:\d{2}/).first()).toBeVisible();
  // Clickable theme toggle present (FR-SHELL-01, ADR-0007).
  await expect(banner.getByRole("button", { name: t.themeToggleLabel })).toBeVisible();
  // Hero + centered search (FR-SHELL-03).
  await expect(page.getByRole("heading", { level: 1, name: t.heroTitle })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: t.searchLabel })).toBeVisible();
  // Footer credits (FR-SHELL-01).
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: /Open-Meteo/ })).toBeVisible();
  await expect(footer.getByRole("link", { name: /OpenStreetMap/ })).toBeVisible();
  await proof(page, "clip-empty-state");
});

test("clip-city-search @FR-SEARCH-01 @FR-SEARCH-02 @FR-SEARCH-05 @FR-SEARCH-06 @NFR-OBS-01", async ({ page }) => {
  await page.goto("/");
  const box = page.getByRole("searchbox", { name: t.searchLabel });
  await box.fill("Київ");
  // Debounced suggestions with name/region/country (FR-SEARCH-01/02).
  const list = page.getByRole("list", { name: t.searchSuggestionsLabel });
  await expect(list).toBeVisible({ timeout: 15_000 });
  await expect(list.getByRole("button").first()).toContainText("Київ");
  // Proof still while suggestions are on screen (FR-SEARCH-01/02).
  await proof(page, "clip-city-search");
  // Zero-results -> calm inline "nothing found", no toast (FR-SEARCH-05).
  await box.fill("Zxqwklmnoptdne");
  await expect(page.getByRole("status")).toContainText(t.searchNothingFound, { timeout: 15_000 });
  // Opt-in geolocation entry point present (FR-SEARCH-06).
  await expect(page.getByRole("button", { name: t.searchUseMyLocation })).toBeVisible();
});

test("clip-forecast @FR-FORECAST-01 @FR-FORECAST-02 @FR-FORECAST-03 @FR-FORECAST-04 @FR-COMFORT-01 @FR-COMFORT-04 @FR-COMFORT-05 @NFR-OBS-01", async ({ page }) => {
  await gotoForecast(page);
  await expect(page.getByRole("heading", { level: 1, name: "Київ" })).toBeVisible();
  // 7 day cards each carry a comfort band word; weekend highlight adds one more.
  const bands = page.getByText(new RegExp(`${t.comfortBandGreenLabel}|${t.comfortBandYellowLabel}|${t.comfortBandRedLabel}`));
  expect(await bands.count()).toBeGreaterThanOrEqual(7);
  // Weekend comfort highlight (FR-COMFORT-05).
  await expect(page.getByText(t.comfortWeekendTitle)).toBeVisible();
  // 48h hourly chart (FR-FORECAST-03).
  await expect(page.locator(".recharts-surface").first()).toBeVisible({ timeout: 15_000 });
  // Sun times (FR-FORECAST-04).
  await expect(page.getByText(t.sunriseLabel).first()).toBeVisible();
  await expect(page.getByText(t.sunsetLabel).first()).toBeVisible();
  await proof(page, "clip-forecast");
});

test("clip-map @FR-MAP-01 @FR-MAP-02 @FR-MAP-04 @FR-MAP-05 @NFR-OBS-01", async ({ page }) => {
  await gotoForecast(page);
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon").first()).toBeVisible({ timeout: 15_000 });
  // OSM attribution is mandatory (TC-MAP-01, FR-MAP-04).
  await expect(page.getByText(t.mapAttribution)).toBeVisible();
  await proof(page, "clip-map");
});

test("clip-weekend-compare @FR-COMPARE-01 @FR-COMPARE-02 @FR-COMPARE-03 @NFR-OBS-01", async ({ page }) => {
  await gotoForecast(page);
  // Pin the active city -> a chip appears (FR-COMPARE-01).
  await page.getByRole("button", { name: new RegExp(t.comparePinCurrent) }).click();
  await expect(page.getByRole("button", { name: `${t.compareUnpinAction} Київ` })).toBeVisible();
  // BUG-006: the unpin control is a comfortable touch target, not a 24px sliver.
  const unpin = page.getByRole("button", { name: `${t.compareUnpinAction} Київ` });
  const box = await unpin.boundingBox();
  expect(box && Math.min(box.width, box.height)).toBeGreaterThanOrEqual(32);
  // Toggle the weekend comparison table (FR-COMPARE-02/03).
  await page.getByRole("button", { name: t.compareToggleLabel }).click();
  await expect(page.getByText(t.compareSaturdayLabel).first()).toBeVisible();
  await expect(page.getByText(t.compareSundayLabel).first()).toBeVisible();
  await expect(page.getByRole("button", { name: t.compareMakeActiveAction }).first()).toBeVisible();
  await proof(page, "clip-weekend-compare");
});

// OBVIOUS-BEHAVIOR fix (BUG-001/002/005). From a forecast a user must be able to
// look up a DIFFERENT city and get home, in-app — without editing the URL or the
// browser back button. This drives the fix end to end.
test("clip-navigation-reachability @FR-SEARCH-01 @FR-SHELL-01 @NFR-OBS-01", async ({ page }) => {
  await gotoForecast(page);
  // BUG-002: the logo is a home link.
  await expect(page.getByRole("link", { name: t.appName })).toBeVisible();
  // BUG-001: search is reachable from the forecast view — use it to switch cities.
  const search = page.getByRole("searchbox", { name: t.searchLabel });
  await expect(search).toBeVisible();
  await search.fill("Львів");
  const list = page.getByRole("list", { name: t.searchSuggestionsLabel });
  await expect(list).toBeVisible({ timeout: 15_000 });
  await list.getByRole("button").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Львів");
  // BUG-005: focus moves to the new city heading after the soft navigation.
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("H1");
  await proof(page, "clip-navigation-reachability");
});

// BUG-001 enables multi-city compare, and BUG-007 makes the table stack on a
// phone without horizontal scroll.
test("clip-compare-multi-mobile @FR-COMPARE-01 @FR-COMPARE-02 @FR-SHELL-02 @NFR-OBS-01", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await gotoForecast(page);
  await page.getByRole("button", { name: new RegExp(t.comparePinCurrent) }).click();
  // Search and pin a second city — only possible because search is now reachable.
  const search = page.getByRole("searchbox", { name: t.searchLabel });
  await search.fill("Львів");
  const list = page.getByRole("list", { name: t.searchSuggestionsLabel });
  await expect(list).toBeVisible({ timeout: 15_000 });
  await list.getByRole("button").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Львів");
  await page.getByRole("button", { name: new RegExp(t.comparePinCurrent) }).click();
  await expect(page.getByRole("button", { name: `${t.compareUnpinAction} Київ` })).toBeVisible();
  await expect(page.getByRole("button", { name: `${t.compareUnpinAction} Львів` })).toBeVisible();
  // Compare both; the page must not scroll horizontally on mobile (BUG-007).
  await page.getByRole("button", { name: t.compareToggleLabel }).click();
  await expect(page.getByText(t.compareSaturdayLabel).first()).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "no horizontal page overflow on mobile").toBeLessThanOrEqual(1);
  await proof(page, "clip-compare-multi-mobile");
});

// BUG-008: the theme control must actually switch the theme on click (it used to
// be a read-only indicator that looked interactive).
test("clip-theme-toggle @FR-SHELL-01 @NFR-OBS-01", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: t.themeToggleLabel });
  await expect(toggle).toBeVisible();
  await toggle.click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after === "dark" || after === "light", "click sets an explicit theme").toBe(true);
  await proof(page, "clip-theme-toggle");
  // Clicking again flips it back the other way.
  await toggle.click();
  const flipped = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(flipped, "second click toggles to the other theme").not.toBe(after);
});

// FR-ANIM-03: reduced-motion users get a static gradient — the particle layer is
// hidden. Emulate the media feature on the page directly (more reliable here than
// test.use for this fixture setup).
test("clip-animated-bg-reduced-motion @FR-ANIM-01 @FR-ANIM-03 @NFR-OBS-01", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoForecast(page, LVIV);
  await expect(page.locator(".sky-particles").first()).toBeHidden();
  await proof(page, "clip-animated-bg-reduced-motion");
});
