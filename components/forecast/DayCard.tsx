import { Wind, Droplets } from "lucide-react";

import { ComfortBadge } from "@/components/comfort/ComfortBadge";
import { WeatherIcon } from "@/components/forecast/WeatherIcon";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { comfortScore } from "@/lib/scoring/comfort";
import { type DailyForecast, ukWeekday } from "@/lib/weather";

// One forecast day (FR-FORECAST-02). Server component: pure presentation, no
// interactivity. Shows the Ukrainian weekday (from the LOCAL date string via
// `ukWeekday`), hi/lo °C, the weather-code icon with its Ukrainian alt text,
// precipitation probability %, wind, and a `ComfortBadge` derived from the day's
// feels-like/precip/wind/cloud/uv via `comfortScore` (FR-COMFORT-01/04). All
// copy comes from `lib/i18n`; the calm tone carries no exclamation marks.

export interface DayCardProps {
  day: DailyForecast;
  /** Highlight ring when this day belongs to the upcoming weekend. */
  highlighted?: boolean;
}

export function DayCard({ day, highlighted = false }: DayCardProps) {
  const weekday = ukWeekday(day.date);
  const comfort = comfortScore({
    feelsLikeC: day.feelsLikeMaxC,
    precipProbability: day.precipProbability,
    windKmh: day.windKmh,
    cloudCover: day.cloudCover,
    uvIndex: day.uvIndex,
  });

  return (
    <Card
      data-highlighted={highlighted ? "true" : undefined}
      className={
        highlighted ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : undefined
      }
    >
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          {/* Empty weekday (invalid date) is omitted rather than rendered as "" */}
          {weekday ? (
            <span className="text-sm font-medium capitalize text-foreground">
              {weekday}
            </span>
          ) : null}
          <ComfortBadge value={comfort.value} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <WeatherIcon weatherCode={day.weatherCode} />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-foreground">
              <span className="sr-only">{t("forecastHighLabel")} </span>
              {Math.round(day.hiC)}&deg;C
            </span>
            <span className="text-sm text-muted-foreground">
              <span className="sr-only">{t("forecastLowLabel")} </span>
              {Math.round(day.loC)}&deg;C
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Droplets aria-hidden="true" className="size-4" />
            <span className="sr-only">{t("forecastPrecipLabel")} </span>
            {Math.round(day.precipProbability)}%
          </span>
          <span className="inline-flex items-center gap-1">
            <Wind aria-hidden="true" className="size-4" />
            <span className="sr-only">{t("forecastWindLabel")} </span>
            {Math.round(day.windKmh)} км/год
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
