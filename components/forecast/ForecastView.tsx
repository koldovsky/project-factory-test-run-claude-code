import { DayCard } from "@/components/forecast/DayCard";
import { HourlyChartLazy } from "@/components/forecast/HourlyChartLazy";
import { SunTimes } from "@/components/forecast/SunTimes";
import { WeekendHighlight } from "@/components/forecast/WeekendHighlight";
import { comfortScore } from "@/lib/scoring/comfort";
import { ukWeekday } from "@/lib/weather";
import { weekendComfort } from "@/lib/scoring/weekend";
import { type Forecast } from "@/lib/weather";

// Composed forecast view (FR-FORECAST-02/03/04, FR-COMFORT-05). Server
// component: renders the weekend comfort highlight, one card per well-formed day
// (render-what-you-have), the lazily-loaded hourly chart, and today's
// sunrise/sunset. The upcoming-weekend days are flagged via the SAME arithmetic
// weekday derivation used everywhere (`ukWeekday`), and the weekend comfort
// average reuses `weekendComfort` over the mapped days — no day-bound logic uses
// the visitor clock or a UTC slice.

export interface ForecastViewProps {
  forecast: Forecast;
}

const SATURDAY = "субота";
const SUNDAY = "неділя";

export function ForecastView({ forecast }: ForecastViewProps) {
  const { days } = forecast;

  // Weekend comfort average over the mapped days (FR-COMFORT-05).
  const weekend = weekendComfort(
    days.map((day) => ({
      date: day.date,
      value: comfortScore({
        feelsLikeC: day.feelsLikeMaxC ?? undefined,
        precipProbability: day.precipProbability ?? undefined,
        windKmh: day.windKmh ?? undefined,
        cloudCover: day.cloudCover ?? undefined,
        uvIndex: day.uvIndex ?? undefined,
      }).value,
    })),
  );

  // The first Saturday anchors the upcoming weekend; its paired Sunday (the next
  // chronological day) shares the highlight. Days are already chronological.
  const highlightedDates = new Set<string>();
  for (const day of days) {
    const weekday = ukWeekday(day.date);
    if (weekday === SATURDAY) {
      highlightedDates.add(day.date);
      break;
    }
  }
  if (highlightedDates.size > 0) {
    let sawSaturday = false;
    for (const day of days) {
      if (sawSaturday && ukWeekday(day.date) === SUNDAY) {
        highlightedDates.add(day.date);
        break;
      }
      if (highlightedDates.has(day.date)) sawSaturday = true;
    }
  }

  return (
    <div className="col-span-full flex flex-col gap-6">
      {weekend ? <WeekendHighlight weekend={weekend} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {days.map((day) => (
          <DayCard
            key={day.date}
            day={day}
            highlighted={highlightedDates.has(day.date)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <HourlyChartLazy hourly={forecast.hourly} />
        <SunTimes sunrise={forecast.sunrise} sunset={forecast.sunset} />
      </div>
    </div>
  );
}
