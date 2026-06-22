"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ComfortBadge } from "@/components/comfort/ComfortBadge";
import { Notice } from "@/components/shell/Notice";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { ActiveLocation } from "@/lib/location/types";
import { toLocationQuery } from "@/lib/location/url";
import { comfortScore } from "@/lib/scoring/comfort";
import { type DailyForecast, type Forecast, weekendDays } from "@/lib/weather";

// Weekend comparison table: one column per pinned city (FR-COMPARE-02/03,
// NFR-OBS-01, NFR-A11Y-01, BC-BRAND-01).
//
// Client component: each column independently fetches `/api/forecast?lat&lon`
// (keyless, server-side Open-Meteo via the route handler), derives ITS OWN
// upcoming Sat/Sun via the pure `weekendDays` from that city's local dates (so
// cities in different time zones resolve correctly), and renders hi/lo, precip %,
// and a comfort badge per cell. Each column has a sticky header with the city
// name and a keyboard-operable "make active" button; a per-column fetch failure
// shows a calm inline Ukrainian message + retry while other columns still
// render. Empty (no pins) shows the calm "pin a city" state, never a blank
// table. All copy comes from `lib/i18n`.

type ColumnState =
  | { status: "loading" }
  | { status: "ok"; forecast: Forecast }
  | { status: "error" };

interface ForecastResponseBody {
  forecast: Forecast | null;
  error?: string;
}

export interface CompareTableProps {
  pins: ActiveLocation[];
}

/** Render one weekend cell value (hi/lo + precip %), or a calm dash when null. */
function WeekendCell({ day }: { day: DailyForecast | null }) {
  if (day === null) {
    // Visible em dash plus an sr-only explanation so assistive tech announces
    // why the cell is empty rather than a bare dash.
    return (
      <span className="text-muted-foreground">
        <span aria-hidden="true">—</span>
        <span className="sr-only">{t("compareNoWeekendData")}</span>
      </span>
    );
  }
  const comfort = comfortScore({
    feelsLikeC: day.feelsLikeMaxC ?? undefined,
    precipProbability: day.precipProbability ?? undefined,
    windKmh: day.windKmh ?? undefined,
    cloudCover: day.cloudCover ?? undefined,
    uvIndex: day.uvIndex ?? undefined,
  });

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-sm text-foreground">
        <span className="font-semibold">{Math.round(day.hiC)}&deg;</span>
        <span className="text-muted-foreground"> / {Math.round(day.loC)}&deg;</span>
      </span>
      <span className="text-xs text-muted-foreground">
        <span className="sr-only">{t("forecastPrecipLabel")} </span>
        {day.precipProbability !== null
          ? `${Math.round(day.precipProbability)}%`
          : "—"}
      </span>
      <ComfortBadge value={comfort.value} />
    </div>
  );
}

/** One pinned-city column: owns its own fetch/loading/error/retry lifecycle. */
function CompareColumn({ city }: { city: ActiveLocation }) {
  const router = useRouter();
  const [state, setState] = useState<ColumnState>({ status: "loading" });
  // Bumping this re-runs the fetch effect (retry); the effect does NOT setState
  // synchronously — state only changes inside the async resolve/reject (or via
  // the retry handler), so there are no cascading renders.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const query = new URLSearchParams({
      lat: String(city.lat),
      lon: String(city.lon),
    });

    fetch(`/api/forecast?${query.toString()}`, {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("upstream");
        const body = (await res.json()) as ForecastResponseBody;
        if (!body.forecast) throw new Error("empty");
        if (!cancelled) setState({ status: "ok", forecast: body.forecast });
      })
      .catch(() => {
        // Calm per-column failure; no console error on a healthy session.
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [city.lat, city.lon, reloadKey]);

  const handleRetry = useCallback(() => {
    setState({ status: "loading" });
    setReloadKey((n) => n + 1);
  }, []);

  const makeActive = useCallback(() => {
    router.push(`/?${toLocationQuery(city)}`);
  }, [router, city]);

  const weekend =
    state.status === "ok"
      ? weekendDays(state.forecast.days)
      : { saturday: null, sunday: null };

  return (
    // Full width (stacked) on mobile so 2-3 cities never force a horizontal
    // scroll in the single-column layout; a fixed-width column on md+ (BUG-007).
    <div className="flex w-full flex-col md:min-w-[10rem]">
      {/* Sticky column header: stays visible while the table body scrolls. */}
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-background px-3 py-2">
        <span className="text-sm font-semibold text-foreground">{city.name}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`${t("compareMakeActiveAction")} ${city.name}`}
          onClick={makeActive}
        >
          {t("compareMakeActiveAction")}
        </Button>
      </div>

      {state.status === "loading" ? (
        <p role="status" className="px-3 py-4 text-sm text-muted-foreground">
          {t("compareColumnLoading")}
        </p>
      ) : null}

      {state.status === "error" ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-2 px-3 py-4 text-sm text-muted-foreground"
        >
          <p>{t("compareColumnError")}</p>
          <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
            {t("compareColumnRetry")}
          </Button>
        </div>
      ) : null}

      {state.status === "ok" ? (
        <dl className="flex flex-col">
          <div className="flex flex-col gap-1 border-b border-border px-3 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("compareSaturdayLabel")}
            </dt>
            <dd>
              <WeekendCell day={weekend.saturday} />
            </dd>
          </div>
          <div className="flex flex-col gap-1 px-3 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("compareSundayLabel")}
            </dt>
            <dd>
              <WeekendCell day={weekend.sunday} />
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

export function CompareTable({ pins }: CompareTableProps) {
  if (pins.length === 0) {
    return (
      <Notice>
        <span className="block font-medium text-foreground">
          {t("compareEmptyTitle")}
        </span>
        <span className="block">{t("compareEmptyHint")}</span>
      </Notice>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("compareTableLabel")}
      className="max-h-[28rem] overflow-auto rounded-md border border-border"
    >
      {/* Stack columns on mobile (single column, no horizontal scroll); lay them
          out in a row from md upward (BUG-007). */}
      <div className="flex flex-col divide-y divide-border md:flex-row md:divide-x md:divide-y-0">
        {pins.map((city) => (
          <CompareColumn key={`${city.lat},${city.lon}`} city={city} />
        ))}
      </div>
    </div>
  );
}
