import { AnimatedBackground } from "@/components/background/AnimatedBackground";
import { ForecastError } from "@/components/forecast/ForecastError";
import { ForecastView } from "@/components/forecast/ForecastView";
import { getForecast } from "@/components/forecast/getForecast";
import { MapPanel } from "@/components/map/MapPanel";
import { CitySearch } from "@/components/search/CitySearch";
import { EmptyState } from "@/components/shell/EmptyState";
import { Notice } from "@/components/shell/Notice";
import { t } from "@/lib/i18n";
import { parseLocationParams } from "@/lib/location/url";
import { localNow, type SkySceneInput } from "@/lib/sky";

// Home route — empty-state-vs-deep-link routing (FR-SHELL-03) plus the active
// location's forecast (FR-FORECAST-01..05).
//
// searchParams is a Promise in Next.js 16 App Router; await it. A complete,
// in-range `?lat&lon&name` fetches the forecast server-side (keyless Open-Meteo,
// request-scoped `getForecast` cache) and renders the day cards / hourly chart /
// sun times, or the calm inline `ForecastError` when the fetch fails or the
// payload is empty/incomplete/malformed. No params → empty state.
// Present-but-invalid params → empty state plus an inline calm Notice, never a
// 500 or blank screen.

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Reduce Next's `string | string[] | undefined` values to first-string-only. */
function firstValues(
  params: RawSearchParams,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const key of ["lat", "lon", "name"]) {
    const value = params[key];
    out[key] = Array.isArray(value) ? value[0] : value;
  }
  return out;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const params = firstValues(raw);

  // Any location param present means the user followed a deep link.
  const hasLocationParams =
    params.lat !== undefined ||
    params.lon !== undefined ||
    params.name !== undefined;

  const parsed = parseLocationParams(params);

  if (parsed.ok) {
    // The city name is the page's primary heading (a real <h1>) so every page
    // state exposes a top-level heading for screen-reader/document structure.
    // Coordinates are already range-validated by `parseLocationParams`;
    // `getForecast` fetches + maps server-side (request-scoped cache), and any
    // non-happy outcome routes to the calm inline `ForecastError` (never a 500).
    const result = await getForecast(parsed.location.lat, parsed.location.lon);

    // Animated background (FR-ANIM-01/02): reuse the already-fetched forecast —
    // today's weather code (days[0]) + today's sun times — plus the location's
    // local "now" derived from the forecast timezone (NOT the visitor clock).
    // Any non-happy outcome leaves the inputs empty, so `skyScene` falls back to
    // the neutral static gradient (FR-ANIM fail-calm).
    const sceneInput: SkySceneInput =
      result.ok && result.forecast.days.length > 0
        ? {
            weatherCode: result.forecast.days[0].weatherCode,
            sunrise: result.forecast.sunrise,
            sunset: result.forecast.sunset,
            nowLocal: localNow(new Date(), result.forecast.timezone),
          }
        : {};

    return (
      <>
        <AnimatedBackground scene={sceneInput} />
        <section className="col-span-full flex w-full flex-col gap-6">
          {/* Theme-aware backing so the city heading keeps AA contrast over the
              theme-independent animated gradient behind it (NFR-A11Y-02). */}
          <h1 className="w-fit rounded-md bg-background/80 px-3 py-1 text-2xl font-semibold tracking-tight text-foreground backdrop-blur-sm">
            {parsed.location.name}
          </h1>
          <MapPanel location={parsed.location} />
          {result.ok ? (
            <ForecastView forecast={result.forecast} />
          ) : (
            <ForecastError />
          )}
        </section>
      </>
    );
  }

  // Invalid/incomplete deep link → empty state with a calm fallback notice.
  // First load (no params at all) → empty state, no notice. The background
  // renders the neutral static gradient (no condition data yet).
  return (
    <>
      <AnimatedBackground />
      {hasLocationParams ? (
        <div className="col-span-full">
          <Notice>{t("deepLinkErrorNotice")}</Notice>
        </div>
      ) : null}
      <EmptyState search={<CitySearch />} />
    </>
  );
}
