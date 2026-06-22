# Demo Script

Ordered narration for the per-capability demo recordings (G6). One clip per
capability, captured against the **running app with live Open-Meteo data** via
the browser MCP (no Playwright — ADR-0001 / TC-STACK-05), plus one
negative/error clip.

Recordings are **illustration**; the eval (`eval-report.md`, G6) and the tests
are the **decision**. Each clip below lists the FR ids it proves so its manifest
entry can be read by the traceability validator.

## Recording quality bar (must follow)

- **One clip per viewport.** Do not resize the viewport mid-clip — a resize while
  recording stretches frames and looks like a broken responsive layout. To prove
  responsiveness, record **separate** clips per viewport (e.g. `01-desktop` +
  `01b-mobile-375`), each with the recording frame size equal to the viewport.
- **Review every artifact before it counts as evidence.** Visually inspect every
  final screenshot and the frame-sensitive moments of every video (or capture a
  dedicated screenshot of those moments): the map tiles loaded, the chart drawn,
  the badge colors correct, the attribution visible. A broken clip shipped to a
  customer is worse than no clip.
- Save under `docs/qa/demo-recordings/` with the file names below; each clip's
  manifest entry must list its FR ids.
- Suggested fixtures: Київ `?lat=50.45&lon=30.52&name=Київ`; a second city
  (Львів) for switching; a far-time-zone city for the night background.

---

## Clip 01 — App shell & empty state
**File:** `01-app-shell-desktop.webm` (+ `01b-app-shell-mobile-375.webm`)
**Proves:** FR-SHELL-01, FR-SHELL-02, FR-SHELL-03

**Steps:**
1. Open the app at `/` (no params), desktop viewport.
2. Pan across the top bar: logo, theme indicator, clock slot.
3. Rest on the centered hero + search empty state.
4. *(Separate clip, mobile 375 px viewport)* open `/` again — show the
   single-column layout.

**Viewer should see:** a calm top bar, the hero copy and centered search, and —
in the mobile clip — a single-column layout (multi-column on desktop). No
forecast/map content.

---

## Clip 02 — Top clock
**File:** `02-top-clock.webm`
**Proves:** FR-CLOCK-01

**Steps:**
1. On any page, zoom the recording on the top-bar clock.
2. Hold for ~5 seconds.

**Viewer should see:** the clock ticking live (seconds/minutes advancing) with
no layout shift as digits change.

---

## Clip 03 — City search
**File:** `03-city-search.webm`
**Proves:** FR-SEARCH-01, FR-SEARCH-02, FR-SEARCH-03, FR-SEARCH-04, FR-SEARCH-06

**Steps:**
1. From the empty state, type `Київ`; pause for the debounced suggestions.
2. Show a suggestion row (name, region, country, flag).
3. Select it; show the URL changing to `?lat&lon&name` and the location view
   loading.
4. *(Optional within the same viewport)* show "Моє місцезнаходження" being
   clicked and the permission prompt appearing only on click (FR-SEARCH-06).

**Viewer should see:** debounced suggestions, a full suggestion row, the URL deep
link forming on selection, and geolocation prompting only on the explicit button.

---

## Clip 04 — Footer jokes & credits
**File:** `04-footer-jokes.webm`
**Proves:** FR-JOKES-01

**Steps:**
1. Scroll to the footer.
2. Rest on the joke line and the Open-Meteo / OpenStreetMap credit links.

**Viewer should see:** a calm Ukrainian weather joke (no exclamation marks) and
the two working credit hyperlinks.

---

## Clip 05 — 7-day forecast, hourly chart, sun times
**File:** `05-forecast.webm`
**Proves:** FR-FORECAST-01, FR-FORECAST-02, FR-FORECAST-03, FR-FORECAST-04, FR-FORECAST-05

**Steps:**
1. Open Київ via deep link.
2. Pan across the 7 day cards (weekday, hi/lo, icon, precip %, wind).
3. Scroll to the 48h hourly line chart; let it finish drawing.
4. Show the sunrise/sunset text under the chart.
5. Switch to Львів; show the forecast re-fetching (values change).

**Viewer should see:** seven well-formed day cards, the hourly chart drawn, the
sun-times line, and a fresh forecast after switching cities. Capture a screenshot
of the fully-drawn chart (frame-sensitive).

---

## Clip 06 — Interactive map
**File:** `06-map.webm`
**Proves:** FR-MAP-01, FR-MAP-02, FR-MAP-03, FR-MAP-04, FR-MAP-05

**Steps:**
1. Open a location view; show the same-footprint skeleton briefly, then the map
   (no layout jump).
2. Click the marker → popup names the city.
3. Show the "© OpenStreetMap contributors" attribution bottom-right.
4. Click an empty point on the map → heading/URL update to rounded coordinates,
   forecast re-fetches.

**Viewer should see:** the client-only map mounting cleanly, the marker popup,
the attribution, and a map-click setting a coordinate-labeled location.

---

## Clip 07 — Comfort score & weekend highlight
**File:** `07-comfort-score.webm`
**Proves:** FR-COMFORT-01, FR-COMFORT-02, FR-COMFORT-03, FR-COMFORT-04, FR-COMFORT-05

**Steps:**
1. Open a location view.
2. Zoom on the per-day comfort badges (green/yellow/red + Ukrainian label).
3. Rest on a badge's rationale sentence.
4. Show the weekend (Sat+Sun avg) highlight at the top of the grid.

**Viewer should see:** colored, labelled comfort badges, a calm rationale, and
the weekend callout. Capture screenshots of a green, a yellow, and a red badge if
the live data offers them.

---

## Clip 08 — Animated background (day / night)
**File:** `08-animated-bg-day.webm` (+ `08b-animated-bg-night.webm`)
**Proves:** FR-ANIM-01, FR-ANIM-02, FR-ANIM-04

**Steps:**
1. Open a daytime location; show the day gradient + any condition particles.
2. *(Separate clip)* open a location whose **local** time is night; show the
   night gradient.
3. Click a control over the background to show clicks pass through (FR-ANIM-04).

**Viewer should see:** distinct day vs night backgrounds driven by the location's
sun times (not the viewer's clock), and interaction passing through the layer.
*(Reduced-motion FR-ANIM-03 is a manual/OS-setting check, MT-09b — capture a
static-gradient screenshot if recording it.)*

---

## Clip 09 — Weekend compare
**File:** `09-weekend-compare.webm`
**Proves:** FR-COMPARE-01, FR-COMPARE-02, FR-COMPARE-03

**Steps:**
1. Pin the active city; switch to two more and pin each (show the chips).
2. Attempt a 4th pin → show the calm inline limit message.
3. Toggle "Порівняти вихідні"; show the 3-column Sat/Sun table (hi/lo, precip %,
   comfort).
4. Scroll to show a sticky column header; click "make active" to switch the main
   view.

**Viewer should see:** up to three pinned chips, the limit message, the compare
table, sticky headers, and make-active switching the active city.

---

## Clip 10 — Negative: offline forecast → calm inline error
**File:** `10-forecast-offline-error.webm`
**Proves:** FR-FORECAST-01, NFR-OBS-01

**Steps:**
1. Open a location view (let it load once).
2. In DevTools, set Network to **Offline**.
3. Switch city (or reload) to trigger a fetch while offline.
4. Show the calm inline error + retry (no 500, no blank). Show the console
   staying free of uncaught errors.
5. Set Network back to **Online**, click retry → forecast loads.

**Viewer should see:** the decisive moment — a fetch failure resolving to a calm
inline Ukrainian message with a working retry, never a crash. This is the clip
that proves "honest under failure". Cite the matching eval verdict
(`eval-forecast-error-copy-tone`, dimension `error-clarity`) as the decision; the
clip illustrates it.
