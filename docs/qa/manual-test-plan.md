# Manual Test Plan

Step-by-step scenarios a non-developer can run in a browser. Each step is an
**action → expected result**, with the FR ids it covers. No login, no test
accounts — the app is keyless and auth-free (ADR-0001).

## Environment

- **Browser:** Google Chrome (latest), desktop. A few cases use a mobile width
  (Chrome DevTools device toolbar at 375 px) and the OS reduced-motion /
  geolocation / theme settings.
- **App URL:** the running app. Locally: `npm run dev` then open the printed URL
  (typically `http://localhost:3000`). On deploy: the Vercel URL.
- **Language:** the UI is Ukrainian. Expected strings below are quoted in
  Ukrainian where they are the checkable result.
- **Console:** for the "silent console" check, open DevTools → Console before
  testing and watch for any warning or error (NFR-OBS-01).

Mark each case ☐ Pass / ☐ Fail and note anything unexpected.

---

## MT-01 — First-load empty state
**Covers:** FR-SHELL-01, FR-SHELL-03, FR-CLOCK-01, BC-PRIVACY-02

**Steps:**
1. Open the app URL with **no query parameters** (just `/`).
2. Observe the top bar.
3. Observe the main area.
4. Wait ~3 seconds watching the clock in the top bar.

**Expected:**
- Top bar shows the logo, a live clock, and a theme indicator
  ("Світла тема" or "Темна тема").
- Main area is centered hero copy ("Дізнайтеся погоду у будь-якому місті" or
  similar) plus a prominent city-search input and a "Моє місцезнаходження"
  button.
- **No** forecast cards, **no** map — only the empty/hero state.
- The clock's minutes/seconds advance live; no layout jump as it ticks.
- No browser permission prompt appears on load (geolocation is opt-in only).

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-02 — Search a city and select it
**Covers:** FR-SEARCH-01, FR-SEARCH-02, FR-SEARCH-03, FR-SEARCH-04

**Steps:**
1. From the empty state, type `Київ` (or `Kyiv`) into the search input.
2. Pause ~0.5 s after typing.
3. Inspect a suggestion row.
4. Click a suggestion (or, if exactly one suggestion shows, press **Enter**).
5. Look at the browser address bar.

**Expected:**
- After the pause, a list of suggestions appears (debounced — they do not flash
  on every keystroke).
- Each suggestion shows the city name, region, country, and (where available) a
  flag emoji.
- Selecting a suggestion loads the location view (city heading, map, forecast).
- The address bar now contains `?lat=...&lon=...&name=...`.
- Pressing **Enter** when there is a single suggestion selects it.

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-02b — Search with no matches (negative)
**Covers:** FR-SEARCH-05

**Steps:**
1. In the search input, type a nonsense string, e.g. `qqqzzzxx`.
2. Wait ~0.5 s.

**Expected:**
- An **inline** "Нічого не знайдено" message appears under the input.
- **No** error toast or pop-up. The page stays calm; no console error.

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-03 — Open via deep link and switch location
**Covers:** FR-SHELL-03, FR-SEARCH-03, FR-FORECAST-01, FR-FORECAST-05

**Steps:**
1. Open the app with `?lat=50.45&lon=30.52&name=Київ` appended to the URL.
2. Confirm the location view renders directly (no manual search needed).
3. Search a different city (e.g. `Львів`) and select it.

**Expected:**
- The deep link loads "Київ" with its forecast and map immediately.
- Selecting a different city updates the heading, the map, and **re-fetches** a
  new forecast for the new location (the day cards/values change).

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-04 — Use my location (opt-in geolocation)
**Covers:** FR-SEARCH-06, BC-PRIVACY-02

**Steps:**
1. From the empty state, click "Моє місцезнаходження".
2. When Chrome asks for location permission, click **Allow**.
3. Repeat from a fresh empty state, but this time click **Block**.

**Expected:**
- The permission prompt appears **only after** clicking the button (never on
  page load).
- On **Allow**: the view loads a location based on your coordinates (the heading
  shows rounded coordinates, e.g. `50.45, 30.52`).
- On **Block**: the app **silently** stays on the search empty state — no error
  toast, no crash.

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-05 — 7-day forecast, hourly chart, sun times
**Covers:** FR-FORECAST-02, FR-FORECAST-03, FR-FORECAST-04

**Steps:**
1. Open any location view (e.g. via MT-03 deep link).
2. Count the day cards and read one.
3. Scroll to the line chart below the cards.
4. Look just under the chart.

**Expected:**
- **7** day cards, each with: Ukrainian weekday, hi/lo in °C, a weather icon,
  precipitation probability %, and wind speed (км/год).
- A line chart showing hourly temperature for the next ~48 hours.
- Small text under the chart with today's sunrise (схід) and sunset (захід)
  times.

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-06 — Map renders with marker and attribution
**Covers:** FR-MAP-01, FR-MAP-02, FR-MAP-04, FR-MAP-05

**Steps:**
1. Open a location view (e.g. Київ).
2. Observe the map area while the page loads, then after it settles.
3. Click the marker.
4. Look at the bottom-right of the map.

**Expected:**
- A skeleton placeholder of the **same size** as the map shows briefly, then the
  interactive OSM map appears with **no layout jump**.
- The map is centered on the city with a marker; clicking the marker shows a
  popup naming the city.
- "© OpenStreetMap contributors" attribution is visible at the bottom-right.

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-07 — Set location by clicking the map
**Covers:** FR-MAP-03, FR-FORECAST-05

**Steps:**
1. From a location view, click somewhere on the map away from the marker.
2. Observe the heading, the URL, and the forecast.

**Expected:**
- The active location moves to the clicked point; the heading and the popup show
  **rounded coordinates** (e.g. `50.31, 30.20`) — not a city name (this is by
  design, ADR-0004; Open-Meteo has no reverse geocoding).
- The URL updates to the new `?lat&lon&name`, and the forecast re-fetches for the
  clicked point.

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-08 — Comfort badges and weekend highlight
**Covers:** FR-COMFORT-03, FR-COMFORT-04, FR-COMFORT-05

**Steps:**
1. Open a location view.
2. Read the colored badge on each day card.
3. Look at the top of the forecast grid for the weekend callout.

**Expected:**
- Each day card has a comfort badge: **green** (≥70), **yellow** (40–69), or
  **red** (<40), with a Ukrainian word label (not color alone).
- The badge carries a short Ukrainian rationale sentence (no exclamation marks,
  no emoji) — confirm tone reads calm and matches the conditions.
- The upcoming weekend (Saturday + Sunday) is highlighted at the top of the grid
  with an averaged comfort score.

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-09 — Animated background (day/night, pass-through)
**Covers:** FR-ANIM-01, FR-ANIM-02, FR-ANIM-04

**Steps:**
1. Open a location view in daytime conditions; note the background gradient.
2. Open a location whose **local** time is night (a city in a different time
   zone, far ahead/behind); note the background.
3. Try to click a day card or button that sits over the background.

**Expected:**
- The background reflects the condition: a day or night gradient, with rain/snow/
  cloud particles when the weather code calls for them.
- Day vs night follows the **active location's** sunrise/sunset, not your own
  clock.
- All clicks reach the content — the background never intercepts interaction.

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-09b — Reduced motion (negative-path for animation)
**Covers:** FR-ANIM-03

**Steps:**
1. Turn on the OS "reduce motion" setting (Windows: Settings → Accessibility →
   Visual effects → Animation effects off; macOS: Accessibility → Display →
   Reduce motion).
2. Reload a location view.

**Expected:**
- The background shows a **static gradient only** — no rain/snow/cloud
  animation, no particle motion.

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-10 — Pin cities and compare the weekend
**Covers:** FR-COMPARE-01, FR-COMPARE-02, FR-COMPARE-03

**Steps:**
1. Open a location view; click the pin/"Закріпити" control to pin the active city.
2. Switch to two more cities and pin each (try to pin a **4th** — observe).
3. Click the "Порівняти вихідні" toggle.
4. In the compare table, scroll and read a column; click a column's
   "make active" button.

**Expected:**
- Pinned cities appear as chips above the forecast.
- A 4th pin is **rejected** with a calm inline message (limit is 3) — no toast.
- The compare table shows one column per pinned city with Saturday and Sunday
  hi/lo, precipitation %, and comfort score.
- Each column has a sticky header with the city name; "make active" switches the
  main view to that city.

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-11 — Footer jokes and credits
**Covers:** FR-JOKES-01, BC-BRAND-02

**Steps:**
1. Scroll to the footer on any page state.
2. Read the joke line and the credit links.
3. Click "Open-Meteo" and "OpenStreetMap".

**Expected:**
- A calm Ukrainian weather joke is shown (no exclamation marks, no emoji).
- Credits name **Open-Meteo** and **OpenStreetMap**, each a working hyperlink
  that opens the respective site in a new tab.

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-12 — Theme follows system; both themes readable
**Covers:** FR-SHELL-01, NFR-A11Y-02, BC-PRIVACY-03

**Steps:**
1. Set the OS color scheme to **light**; reload the app.
2. Set the OS color scheme to **dark**; reload the app.
3. In each, read the top-bar theme indicator and the hero/city heading over the
   animated background.
4. Open DevTools → Application → Cookies and check for app-set cookies.

**Expected:**
- Light OS → "Світла тема" indicator + light palette; dark OS → "Темна тема" +
  dark palette. No manual toggle control exists (by design, Checkpoint 1).
- The hero text and the city heading stay clearly readable over the gradient in
  both themes (a backing scrim preserves contrast, NFR-A11Y-02).
- **No** cookies are set by the application (BC-PRIVACY-03).

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-13 — Offline forecast → calm inline error (negative)
**Covers:** FR-FORECAST-01, NFR-OBS-01

**Steps:**
1. Open a location view and let it load once.
2. Open DevTools → Network → set throttling to **Offline**.
3. Trigger a fresh forecast fetch: switch to a different city, or reload the
   page while offline.
4. Observe the forecast area, then the console.

**Expected:**
- The forecast area shows a **calm inline** Ukrainian message (no exclamation
  marks) with a retry control — **not** a 500 page and **not** a blank area.
- Set Network back to **Online** and click retry → the forecast loads.
- The console stays free of uncaught errors during the failure (NFR-OBS-01).

**Result:** ☐ Pass ☐ Fail — notes: ______

---

## MT-14 — Console silent on a healthy session (cross-cutting)
**Covers:** NFR-OBS-01

**Steps:**
1. Open DevTools → Console.
2. Walk the happy path: empty state → search → location view (map + chart load)
   → pin/compare → switch theme.

**Expected:**
- **Zero** console warnings and **zero** errors throughout, including while
  Leaflet, Recharts, and the live fetch initialize. (Confirmed in
  `g5-browser-smoke.md`; re-confirm in your environment.)

**Result:** ☐ Pass ☐ Fail — notes: ______
