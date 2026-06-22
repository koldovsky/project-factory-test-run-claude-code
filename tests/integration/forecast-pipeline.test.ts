// @trace FR-FORECAST-01, FR-FORECAST-02, FR-COMFORT-04, FR-COMFORT-05
//
// Phase 5 cross-cutting integration WITHOUT a route: the pure forecast → comfort
// → weekend chain composed end-to-end over a recorded Open-Meteo body (ADR-0001:
// keyless/DB-free — recorded responses are the deterministic fixtures). This is
// the integration that no single unit test owns: it proves `mapForecast`,
// `comfortScore`, `comfortBand`, `weekendDays`, `weekendComfort`, and `ukWeekday`
// agree on the SAME upcoming Saturday/Sunday and that the null-horizon body still
// maps with comfort falling back to defaults. Runs over implemented code → green.

import { describe, expect, it } from "vitest";

import {
  mapForecast,
  weekendDays,
  ukWeekday,
  type DailyForecast,
} from "@/lib/weather";
import { comfortBand } from "@/lib/scoring/band";
import { comfortScore } from "@/lib/scoring/comfort";
import { weekendComfort, type WeekendDay } from "@/lib/scoring/weekend";

import { forecastFixture, forecastNullHorizonFixture } from "./fixtures";

const SATURDAY = "2026-06-20";
const SUNDAY = "2026-06-21";

/** Map a `DailyForecast` onto the comfort function's input shape. */
function toComfortInput(day: DailyForecast) {
  return {
    feelsLikeC: day.feelsLikeMaxC ?? undefined,
    precipProbability: day.precipProbability ?? undefined,
    windKmh: day.windKmh ?? undefined,
    cloudCover: day.cloudCover ?? undefined,
    uvIndex: day.uvIndex ?? undefined,
  };
}

/** Build the `{date,value}[]` comfort series the weekend average consumes. */
function comfortSeries(days: DailyForecast[]): WeekendDay[] {
  return days.map((day) => ({
    date: day.date,
    value: comfortScore(toComfortInput(day)).value,
  }));
}

describe("pipeline — mapForecast feeds comfortScore + comfortBand (FR-FORECAST-01, FR-COMFORT-04)", () => {
  it("maps the recorded body and scores every day into a valid band", () => {
    const mapped = mapForecast(forecastFixture);
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;

    expect(mapped.forecast.days).toHaveLength(7);

    for (const day of mapped.forecast.days) {
      const { value, rationale } = comfortScore(toComfortInput(day));

      // comfortScore is total: integer, clamped 0..100, calm rationale.
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
      expect(rationale.length).toBeGreaterThan(0);
      expect(rationale).not.toContain("!");

      // comfortBand classifies every value into exactly one of three bands.
      const band = comfortBand(value);
      expect(["green", "yellow", "red"]).toContain(band);
      // Half-open band boundaries (FR-COMFORT-04): 70+ green, 40..69 yellow.
      if (value >= 70) expect(band).toBe("green");
      else if (value >= 40) expect(band).toBe("yellow");
      else expect(band).toBe("red");
    }
  });
});

describe("pipeline — weekendDays and weekendComfort agree on the same Sat/Sun (FR-COMFORT-05)", () => {
  it("selects 2026-06-20 / 2026-06-21 and averages their comfort scores half-up", () => {
    const mapped = mapForecast(forecastFixture);
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;

    const days = mapped.forecast.days;

    // 1) weekendDays picks the day OBJECTS for the upcoming Sat + Sun.
    const { saturday, sunday } = weekendDays(days);
    expect(saturday).not.toBeNull();
    expect(sunday).not.toBeNull();
    expect(saturday!.date).toBe(SATURDAY);
    expect(sunday!.date).toBe(SUNDAY);

    // 2) The {date,value}[] comfort series feeds weekendComfort independently.
    const series = comfortSeries(days);
    const result = weekendComfort(series);
    expect(result).not.toBeNull();
    expect(result!.dayCount).toBe(2);
    expect(result!.partial).toBe(false);

    // 3) Both slices must name the SAME two weekend days, so the weekend
    //    average must equal the round-half-up mean of those two days' scores.
    const satScore = comfortScore(toComfortInput(saturday!)).value;
    const sunScore = comfortScore(toComfortInput(sunday!)).value;
    const expected = Math.floor((satScore + sunScore) / 2 + 0.5);

    expect(result!.value).toBe(expected);

    // And cross-check against the series lookup (no off-by-one between slices).
    const satFromSeries = series.find((d) => d.date === SATURDAY)!.value;
    const sunFromSeries = series.find((d) => d.date === SUNDAY)!.value;
    expect(satFromSeries).toBe(satScore);
    expect(sunFromSeries).toBe(sunScore);
  });

  it("is timezone-invariant: the weekend value is stable across host TZs", () => {
    const mapped = mapForecast(forecastFixture);
    if (!mapped.ok) throw new Error("fixture must map");
    const series = comfortSeries(mapped.forecast.days);

    const original = process.env.TZ;
    const values: Array<number | null> = [];
    for (const tz of ["UTC", "Pacific/Kiritimati", "Etc/GMT+12", "Asia/Kolkata"]) {
      process.env.TZ = tz;
      const r = weekendComfort(series);
      values.push(r ? r.value : null);
    }
    process.env.TZ = original;

    expect(new Set(values).size).toBe(1);
  });
});

describe("pipeline — null-horizon body still maps; comfort uses defaults (FR-FORECAST-01, FR-COMFORT-05)", () => {
  it("keeps all 7 days when precip/uv are null beyond the horizon", () => {
    const mapped = mapForecast(forecastNullHorizonFixture);
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;

    // The horizon-null fields must NOT drop the day (review-gate finding).
    expect(mapped.forecast.days).toHaveLength(7);

    const saturday = mapped.forecast.days.find((d) => d.date === SATURDAY)!;
    // Saturday carries null precip + null uv in this fixture.
    expect(saturday.precipProbability).toBeNull();
    expect(saturday.uvIndex).toBeNull();

    // comfortScore still produces a valid clamped integer using its neutral
    // defaults for the null inputs — never NaN, never a throw.
    const { value } = comfortScore(toComfortInput(saturday));
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(100);

    // The weekend average is still computable from the null-horizon series.
    const result = weekendComfort(comfortSeries(mapped.forecast.days));
    expect(result).not.toBeNull();
    expect(result!.dayCount).toBe(2);
  });
});

describe("pipeline — weekday labels are Ukrainian (FR-FORECAST-02)", () => {
  it("labels the mapped days with the correct Ukrainian weekday names", () => {
    const mapped = mapForecast(forecastFixture);
    if (!mapped.ok) throw new Error("fixture must map");

    const labels = mapped.forecast.days.map((d) => ukWeekday(d.date));

    // Fri .. Thu in Ukrainian, in mapped order (timezone-invariant arithmetic).
    expect(labels).toEqual([
      "пʼятниця", // 2026-06-19 Fri
      "субота", //   2026-06-20 Sat
      "неділя", //   2026-06-21 Sun
      "понеділок", // 2026-06-22 Mon
      "вівторок", //  2026-06-23 Tue
      "середа", //   2026-06-24 Wed
      "четвер", //   2026-06-25 Thu
    ]);

    // The weekend slice's two days must carry the Saturday/Sunday labels.
    const { saturday, sunday } = weekendDays(mapped.forecast.days);
    expect(ukWeekday(saturday!.date)).toBe("субота");
    expect(ukWeekday(sunday!.date)).toBe("неділя");
  });
});
