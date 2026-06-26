// Weather table assembly (docs/day-03-skills-demo.md). The batch fetch boundary
// is mocked so the test is deterministic and offline.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./forecasts", () => ({ fetchForecasts: vi.fn() }));

import { fetchForecasts } from "./forecasts";
import type { MapForecastResult } from "../weather/map";
import type { DailyForecast, Forecast } from "../weather/types";
import { CITIES } from "./cities";
import { getWeatherTable } from "./weatherTable";

const mocked = vi.mocked(fetchForecasts);
const DATES = ["2026-06-27", "2026-06-28"];

function forecast(over: Partial<DailyForecast>): Forecast {
  const mk = (date: string): DailyForecast => ({
    date,
    hiC: 20,
    loC: 12,
    weatherCode: 0,
    feelsLikeMaxC: 20,
    precipProbability: 10,
    windKmh: 8,
    cloudCover: 30,
    uvIndex: 4,
    ...over,
  });
  return {
    days: DATES.map(mk),
    hourly: { time: [], tempC: [] },
    sunrise: "2026-06-27T05:00",
    sunset: "2026-06-27T21:00",
    timezone: "Europe/Kyiv",
  };
}

const latOf = (en: string) => CITIES.find((c) => c.nameEn === en)!.lat;

function aligned(fn: (lat: number) => MapForecastResult) {
  return async (coords?: { lat: number; lon: number }[]): Promise<MapForecastResult[]> =>
    (coords ?? []).map((c) => fn(c.lat));
}

beforeEach(() => mocked.mockReset());

describe("getWeatherTable", () => {
  it("summarises every city with mean metrics + a comfort signal", async () => {
    mocked.mockImplementation(
      aligned(() => ({
        ok: true,
        forecast: forecast({ feelsLikeMaxC: 21, precipProbability: 10, windKmh: 8, cloudCover: 30 }),
      })),
    );
    const table = await getWeatherTable(DATES);
    expect(table.cities).toHaveLength(CITIES.length);
    expect(table.cities[0].feelsLikeMaxC).toBe(21);
    expect(table.cities[0].precipProbability).toBe(10);
    expect(table.cities[0].comfort).toBeGreaterThan(0);
    expect(typeof table.cities[0].comfortHint).toBe("string");
  });

  it("notes a fallback when the dates are beyond the horizon", async () => {
    mocked.mockImplementation(aligned(() => ({ ok: true, forecast: forecast({}) })));
    const table = await getWeatherTable(["2030-01-01"]);
    expect(table.notes.some((n) => n.includes("поза межами"))).toBe(true);
    expect(table.cities.length).toBeGreaterThan(0);
  });

  it("notes partial coverage and scores only the in-horizon dates", async () => {
    // forecast has 2026-06-27 + 28; 2026-06-29 is out of horizon.
    mocked.mockImplementation(aligned(() => ({ ok: true, forecast: forecast({}) })));
    const table = await getWeatherTable(["2026-06-27", "2026-06-29"]);
    expect(table.dates).toEqual(["2026-06-27"]);
    expect(table.notes.some((n) => n.includes("Частина дат поза прогнозом"))).toBe(true);
    expect(table.cities.length).toBeGreaterThan(0);
  });

  it("skips cities whose forecast is unavailable", async () => {
    mocked.mockImplementation(
      aligned((lat) =>
        Math.abs(lat - latOf("Odesa")) < 1e-4
          ? { ok: false, reason: "network" }
          : { ok: true, forecast: forecast({}) },
      ),
    );
    const table = await getWeatherTable(DATES);
    expect(table.cities).toHaveLength(CITIES.length - 1);
    expect(table.cities.find((c) => c.nameEn === "Odesa")).toBeUndefined();
  });
});
