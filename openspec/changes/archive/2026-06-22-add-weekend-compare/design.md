# Design — add-weekend-compare

## Goals / Non-goals

- **Goals:** pin up to 3 cities (chip row + limit); compare toggle → 3-column
  Sat/Sun table (hi/lo, precip %, comfort score) by each city's local date;
  sticky header + make-active; empty state; per-column failure + retry; client-only.
- **Non-goals:** server persistence, accounts, saved comparisons; >3 pins.

## Key decisions

1. **Client-only pin state.** Pinned cities live in React state in a client
   container (`CompareProvider`/`CompareView`). No cookies (BC-PRIVACY-03);
   persistence across reload is explicitly not required (the empty state is the
   acceptable post-reload result). Pin = the current active location
   (`{lat,lon,name}` from the URL).
2. **Per-city forecast via a keyless `/api/forecast` Route Handler.** The compare
   view is client-side (interactive pin/toggle), but Open-Meteo must be called
   server-side (TC-DATA-01). So add `app/api/forecast/route.ts` (GET `?lat&lon`)
   that calls the existing `fetchForecast(lat,lon)` and returns the mapped
   `Forecast` (or a calm error status). The client fetches one per pinned city;
   a per-city fetch failure shows that column's calm message + retry while the
   others render.
3. **Pure `weekendDays(days): { saturday: DailyForecast|null; sunday: DailyForecast|null }`**
   in `lib/weather` — finds the upcoming Sat/Sun from each day's LOCAL date via
   `ukWeekday` (never the visitor clock / UTC slice). Each column derives its
   weekend rows from its OWN forecast (so different time zones resolve correctly).
   Comfort per cell = `comfortScore(day)` (tolerates nulls).
4. **Pin-limit logic** kept in a tiny pure helper or the reducer: max 3; at the
   limit, pinning is a no-op + a calm inline message; unpinning frees a slot.
5. **Layout:** PinBar (chips, above the forecast) + a "Compare weekend" toggle;
   when on, render `CompareTable` (CSS sticky `<th>` headers, one column per pinned
   city, Sat/Sun rows). All controls keyboard-operable with visible focus +
   accessible names; make-active navigates to that city's `?lat&lon&name`.

## Data model (pure / client)

`weekendDays(days: DailyForecast[]): { saturday: DailyForecast|null; sunday: DailyForecast|null }`.
Client state: `pins: ActiveLocation[]` (≤3), `comparing: boolean`, per-pin fetch
state (idle/loading/ok/error).

## Error handling

- `/api/forecast`: invalid coords / upstream failure → calm non-2xx JSON; never throws.
- Per-column client fetch failure → calm Ukrainian message + retry; other columns unaffected.
- Empty (no pins) → calm "pin a city" message, never a blank table.

## Risks & mitigations

- **N fetches:** at most 3; reuse the route handler; show per-column loading.
- **Local-date weekend per city:** `weekendDays` uses each forecast's local dates
  (unit-tested), not a shared clock.
- **Sticky header cross-browser:** CSS `position: sticky` on `<th>`; verified at G6.
- **No cookies:** state is in-memory React state only.
