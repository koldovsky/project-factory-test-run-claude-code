"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { flagEmoji, type GeoSuggestion } from "@/lib/geo";
import { t } from "@/lib/i18n";
import { coordinateLabel } from "@/lib/location/coordinateLabel";
import { toLocationQuery } from "@/lib/location/url";

// City search (FR-SEARCH-01..06). Client component: it owns the debounced
// fetch, an accessible focusable suggestion button-list (a plain native-button
// list, not an ARIA combobox — see the add-city-search review: a combobox
// without aria-activedescendant/arrow-nav advertises semantics it does not
// drive), keyboard handling, and the opt-in geolocation path. All pure mapping
// lives in `lib/geo`; all copy comes from `lib/i18n`. The geocoding URL never
// ships here — the component calls our own `/api/geocode` proxy (TC-DATA-01).
//
// Key behaviors:
//  - ~300 ms trailing debounce; whitespace-only input issues no request.
//  - Stale-response guard: each request carries an id; only the latest applies.
//  - Selection -> `?lat&lon&name` via router.push (sets the active location).
//  - Enter auto-selects a lone suggestion; with 0 or 2+ it does nothing.
//  - Zero results -> inline "Nothing found" (no toast). Failure -> inline calm
//    error + retry. Both clear when a new search succeeds.
//  - "Use my location" requests geolocation only on click (never on load);
//    denial/error falls back silently to the empty state.

const DEBOUNCE_MS = 300;
const MAX_QUERY_LENGTH = 200;

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "results"; suggestions: GeoSuggestion[] }
  | { status: "empty" }
  | { status: "error" };

// The geolocation result has no place name, so it is labelled by coordinates —
// using the SHARED `coordinateLabel` (lib/location) so a geolocation label and a
// map-click label are identical for the same point (global review finding).

export function CitySearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const [locating, setLocating] = useState(false);
  // True when the browser has no geolocation support, so the button shows a calm
  // inline note instead of doing nothing (BUG-004).
  const [geoUnsupported, setGeoUnsupported] = useState(false);

  // Monotonic request id: responses from anything but the latest request are
  // dropped (debounce-race guard, design risk "Debounce races").
  const requestIdRef = useRef(0);

  const runSearch = useCallback(async (rawQuery: string) => {
    const trimmed = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
    if (trimmed === "") return; // whitespace-only is "no search"

    const id = ++requestIdRef.current;
    setState({ status: "loading" });

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
        headers: { Accept: "application/json" },
      });
      if (id !== requestIdRef.current) return; // stale

      if (!res.ok) {
        setState({ status: "error" });
        return;
      }

      const body: unknown = await res.json();
      if (id !== requestIdRef.current) return; // stale

      const suggestions =
        body && typeof body === "object" && "suggestions" in body
          ? ((body as { suggestions?: GeoSuggestion[] }).suggestions ?? [])
          : [];

      setState(
        suggestions.length > 0
          ? { status: "results", suggestions }
          : { status: "empty" },
      );
    } catch {
      if (id !== requestIdRef.current) return; // stale
      setState({ status: "error" });
    }
  }, []);

  // Trailing debounce: re-arm the timer on each non-empty query change; only the
  // final value after a >=300ms pause issues a request. The empty/whitespace
  // reset happens synchronously in the change handler (an event, not an effect),
  // so the effect never sets state synchronously. Cleanup clears the timer so
  // there is no leaked work on unmount (NFR-OBS-01).
  useEffect(() => {
    if (query.trim() === "") return;
    const timer = setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [query, runSearch]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    // Clearing to empty/whitespace is "no search": drop any in-flight response
    // and return to idle immediately, with no inline message (FR-SEARCH-05).
    if (value.trim() === "") {
      requestIdRef.current += 1;
      setState({ status: "idle" });
    }
  }, []);

  const navigateTo = useCallback(
    (location: { lat: number; lon: number; name: string }) => {
      router.push(`/?${toLocationQuery(location)}`);
    },
    [router],
  );

  const selectSuggestion = useCallback(
    (suggestion: GeoSuggestion) => {
      navigateTo({
        lat: suggestion.lat,
        lon: suggestion.lon,
        name: suggestion.name,
      });
    },
    [navigateTo],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      // Enter auto-selects ONLY a lone suggestion (FR-SEARCH-04).
      if (state.status === "results" && state.suggestions.length === 1) {
        event.preventDefault();
        selectSuggestion(state.suggestions[0]);
      }
    },
    [state, selectSuggestion],
  );

  const handleUseMyLocation = useCallback(() => {
    // Opt-in only (BC-PRIVACY-02): geolocation is requested here, never on load.
    // No support -> calm inline note instead of a dead button (BUG-004).
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoUnsupported(true);
      return;
    }
    setGeoUnsupported(false);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        navigateTo({
          lat: latitude,
          lon: longitude,
          name: coordinateLabel(latitude, longitude),
        });
      },
      () => {
        // Denial/failure/timeout -> silent fallback to the empty state (no toast).
        setLocating(false);
      },
      // A finite timeout so the button can never hang forever waiting for a fix
      // that never resolves; the error path above re-enables it (BUG-003).
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [navigateTo]);

  return (
    <div className="flex w-full flex-col gap-3">
      {/* A plain labelled search input. Suggestions are a list of focusable
          buttons (below) rather than an ARIA combobox/listbox: that pattern would
          require aria-activedescendant + arrow-key navigation to be honest, so the
          simpler button list is fully keyboard accessible (each suggestion is a
          native button) without advertising semantics it does not drive
          (NFR-A11Y-01). Enter still auto-selects a lone suggestion (FR-SEARCH-04). */}
      <Input
        type="search"
        aria-label={t("searchLabel")}
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("searchPlaceholder")}
        autoComplete="off"
      />

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseMyLocation}
          disabled={locating}
        >
          {locating ? t("searchLocating") : t("searchUseMyLocation")}
        </Button>
      </div>

      {geoUnsupported ? (
        <p role="status" className="text-center text-sm text-muted-foreground">
          {t("searchGeoUnsupported")}
        </p>
      ) : null}

      {/* The suggestion list is rendered ONLY when there are results, so no empty
          named element is exposed in idle/loading/empty/error states (those have
          their own role=status/alert nodes below). Each suggestion is a native
          <button> — focusable, Enter/Space-activatable, with a visible focus ring.
          FR-SEARCH-05 keeps all states inline — no toast, no transient popup. */}
      {state.status === "results" ? (
        <ul aria-label={t("searchSuggestionsLabel")} className="flex flex-col gap-1">
          {state.suggestions.map((suggestion, index) => {
            const flag = flagEmoji(suggestion.countryCode);
            const region = suggestion.admin1;
            const country = suggestion.country;
            return (
              <li
                key={`${suggestion.name}-${suggestion.lat}-${suggestion.lon}-${index}`}
              >
                <button
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {flag ? <span aria-hidden="true">{flag}</span> : null}
                  <span className="font-medium">{suggestion.name}</span>
                  {region ? (
                    <span className="text-muted-foreground">{region}</span>
                  ) : null}
                  {country ? (
                    <span className="text-muted-foreground">{country}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {state.status === "empty" ? (
        <p role="status" className="text-center text-sm text-muted-foreground">
          {t("searchNothingFound")}
        </p>
      ) : null}

      {state.status === "error" ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground"
        >
          <p>{t("searchError")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void runSearch(query)}
          >
            {t("searchRetry")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
