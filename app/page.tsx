import { CitySearch } from "@/components/search/CitySearch";
import { EmptyState } from "@/components/shell/EmptyState";
import { Notice } from "@/components/shell/Notice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { parseLocationParams } from "@/lib/location/url";

// Home route — empty-state-vs-deep-link routing (FR-SHELL-03).
//
// searchParams is a Promise in Next.js 16 App Router; await it. A complete,
// in-range `?lat&lon&name` renders the location view directly (here a calm
// placeholder — the forecast arrives in a later slice). No params → empty state.
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
    // Location view placeholder — the real forecast comes in a later slice.
    // The city name is the page's primary heading (a real <h1>) so every page
    // state exposes a top-level heading for screen-reader/document structure.
    return (
      <Card className="col-span-full mx-auto w-full max-w-xl">
        <CardHeader>
          <h1 className="text-lg font-semibold leading-none tracking-tight">
            {parsed.location.name}
          </h1>
          <CardDescription>{t("locationLoadingTitle")}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("locationLoadingHint")}
        </CardContent>
      </Card>
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
