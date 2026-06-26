// Weather data table for the agent to reason over (docs/day-03-skills-demo.md).
//
// This is the "data" half of the agent-ranked flow: fetch every candidate city's
// forecast for the dates (one reliable multi-coordinate request) and reduce it to
// a compact per-city summary. The AGENT reads this and decides the ranking — this
// module does NO ranking. Reuses the app's `comfortScore` only as ONE signal
// among the raw metrics (the agent may ignore it for non-comfort criteria).
//
// Framework-free except the network in `fetchForecasts`; never throws.

import { comfortScore } from "../scoring/comfort";
import type { DailyForecast } from "../weather/types";
import { CITIES } from "./cities";
import { fetchForecasts } from "./forecasts";

export interface CityWeather {
  nameUk: string;
  nameEn: string;
  /** Means over the in-range dates (null when never available). */
  feelsLikeMaxC: number | null;
  precipProbability: number | null;
  windKmh: number | null;
  cloudCover: number | null;
  /** Comfort signal (mean 0..100) + its calm hint — one input, not the verdict. */
  comfort: number;
  comfortHint: string;
}

export interface WeatherTable {
  dates: string[];
  cities: CityWeather[];
  notes: string[];
}

function meanOf(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

/** Fetch + summarise weather for every candidate city over the given dates. */
export async function getWeatherTable(dates: string[]): Promise<WeatherTable> {
  const forecasts = await fetchForecasts(CITIES.map((c) => ({ lat: c.lat, lon: c.lon })));
  const notes: string[] = [];
  const cities: CityWeather[] = [];

  // The forecast horizon = the union of days every city actually returned. We
  // score EVERY city over the SAME set of dates so the means are comparable, and
  // we only ever average days the user asked for (no silent per-city divergence).
  const horizon = new Set<string>();
  for (const res of forecasts) {
    if (res.ok) for (const d of res.forecast.days) horizon.add(d.date);
  }
  const requestedInHorizon = dates.filter((d) => horizon.has(d));
  // If none of the requested dates are available, fall back to all horizon days;
  // otherwise score exactly the in-horizon requested dates.
  const effective =
    requestedInHorizon.length > 0
      ? requestedInHorizon
      : Array.from(horizon).sort();

  CITIES.forEach((city, i) => {
    const res = forecasts[i];
    if (!res.ok) return;
    const byDate = new Map(res.forecast.days.map((d) => [d.date, d]));
    const chosen = effective
      .map((d) => byDate.get(d))
      .filter((d): d is DailyForecast => d !== undefined);
    if (chosen.length === 0) return;

    let comfortSum = 0;
    let worst: { value: number; rationale: string } | null = null;
    for (const d of chosen) {
      const c = comfortScore({
        feelsLikeC: d.feelsLikeMaxC ?? d.hiC,
        precipProbability: d.precipProbability ?? undefined,
        windKmh: d.windKmh ?? undefined,
        cloudCover: d.cloudCover ?? undefined,
        uvIndex: d.uvIndex ?? undefined,
      });
      comfortSum += c.value;
      if (!worst || c.value < worst.value) worst = c;
    }

    cities.push({
      nameUk: city.nameUk,
      nameEn: city.nameEn,
      feelsLikeMaxC: meanOf(chosen.map((d) => d.feelsLikeMaxC ?? d.hiC)),
      precipProbability: meanOf(chosen.map((d) => d.precipProbability)),
      windKmh: meanOf(chosen.map((d) => d.windKmh)),
      cloudCover: meanOf(chosen.map((d) => d.cloudCover)),
      comfort: Math.round(comfortSum / chosen.length),
      comfortHint: worst ? worst.rationale : "",
    });
  });

  if (dates.length > 0) {
    if (requestedInHorizon.length === 0) {
      notes.push("Обрані дати поза межами 7-денного прогнозу — показано найкращі доступні дні.");
    } else if (requestedInHorizon.length < dates.length) {
      notes.push(`Частина дат поза прогнозом — оцінено лише: ${requestedInHorizon.join(", ")}.`);
    }
  }
  if (cities.length === 0) notes.push("Не вдалося отримати прогноз для жодного міста.");

  // Report the dates actually scored (honest about horizon clamping).
  return { dates: effective, cities, notes };
}
