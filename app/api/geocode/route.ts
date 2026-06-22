// Geocoding proxy route handler (FR-SEARCH-01, TC-DATA-01, NFR-COST-01).
//
// The client calls `/api/geocode?q=...`; this handler calls the keyless
// Open-Meteo geocoding API server-side and returns the mapped suggestions. This
// keeps the Open-Meteo URL out of the client bundle (TC-DATA-01) — no API key
// exists or is required (Open-Meteo is keyless). The handler bounds `q` (trim;
// empty -> empty result, no upstream call; cap length), requests Ukrainian
// labels (`language=uk`), and never throws raw: any upstream/network failure
// degrades to a calm non-2xx JSON body the client surfaces inline.

import { parseGeocodeResponse, type GeoSuggestion } from "@/lib/geo";

// Bound the query so a pasted megastring never reaches the upstream or throws
// (TC-DATA-01). Open-Meteo treats overly long names as no-match anyway.
const MAX_QUERY_LENGTH = 200;
const RESULT_COUNT = 10;
const UPSTREAM_TIMEOUT_MS = 8000;
const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";

/** Type the JSON body so the calm error shape is consistent across branches. */
interface GeocodeResponseBody {
  suggestions: GeoSuggestion[];
}

function emptyResult(): Response {
  return Response.json({ suggestions: [] } satisfies GeocodeResponseBody);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const raw = url.searchParams.get("q") ?? "";
  const query = raw.trim().slice(0, MAX_QUERY_LENGTH);

  // Empty / whitespace-only query is "no search": no upstream call, no error.
  if (query === "") return emptyResult();

  const upstream = new URL(GEOCODING_ENDPOINT);
  upstream.searchParams.set("name", query);
  upstream.searchParams.set("count", String(RESULT_COUNT));
  upstream.searchParams.set("language", "uk");
  upstream.searchParams.set("format", "json");

  try {
    const res = await fetch(upstream, {
      headers: { Accept: "application/json" },
      // Bound the upstream call so a slow/hung Open-Meteo never stalls the
      // request; a timeout aborts and is caught below as a calm 502.
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    // Non-2xx upstream → calm error status, never a raw throw or a 500 page.
    if (!res.ok) {
      return Response.json(
        { suggestions: [], error: "upstream" },
        { status: 502 },
      );
    }

    const json: unknown = await res.json();
    const suggestions = parseGeocodeResponse(json);
    return Response.json({ suggestions } satisfies GeocodeResponseBody);
  } catch {
    // Network failure / invalid JSON → calm error status; the client shows the
    // inline error + retry (FR-SEARCH-05). No driver internals leak.
    return Response.json(
      { suggestions: [], error: "network" },
      { status: 502 },
    );
  }
}
