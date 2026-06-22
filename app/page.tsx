import { ForecastError } from "@/components/forecast/ForecastError";
import { ForecastView } from "@/components/forecast/ForecastView";
import { getForecast } from "@/components/forecast/getForecast";
import { CitySearch } from "@/components/search/CitySearch";
import { EmptyState } from "@/components/shell/EmptyState";
import { Notice } from "@/components/shell/Notice";
import { t } from "@/lib/i18n";
import { parseLocationParams } from "@/lib/location/url";

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

    return (
      <section className="col-span-full flex w-full flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {parsed.location.name}
        </h1>
        {result.ok ? (
          <ForecastView forecast={result.forecast} />
        ) : (
          <ForecastError />
        )}
      </section>
    );
  }

  // Invalid/incomplete deep link → empty state with a calm fallback notice.
  // First load (no params at all) → empty state, no notice.
  return (
    <>
      {hasLocationParams ? (
        <div className="col-span-full">
          <Notice>{t("deepLinkErrorNotice")}</Notice>
        </div>
      ) : null}
      <EmptyState search={<CitySearch />} />
    </>
  );
}
