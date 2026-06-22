// @trace FR-FORECAST-01, FR-FORECAST-02, NFR-OBS-01
//
// Test-first (RED): written BEFORE `lib/weather/map.ts` and `lib/weather/types.ts`
// exist. These tests define the contract for the pure, framework-free
// `mapForecast(json)` mapper that turns a raw Open-Meteo forecast response (daily
// + hourly) into the domain `Forecast` shape (FR-FORECAST-01, FR-FORECAST-02,
// TC-PURE-01, TC-DATA-01).
//
// The mapper is TOTAL over any structurally valid OR invalid response shape
// (spec "Keep Open-Meteo mappers and types pure in lib/weather"): a well-formed
// daily+hourly body → `{ ok: true, forecast }`; an empty / missing-`daily` /
// missing-hourly-temps / null-sun-times / malformed/unparseable body →
// `{ ok: false, reason }` and NEVER throws, so the caller can route any
// non-happy outcome to the same calm inline state (NFR-OBS-01).
//
// Per tasks.md §2.1 (happy + partial) and §2.2 (failures, never throws). They
// MUST fail today (module not found / missing exports), then drive the
// implementation to green. Never weaken these to pass — strengthen if green.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./types`:
//
//   // One mapped forecast day (location-local). Field names per design.md /
//   // docs/open-meteo-reference.md.
//   export interface DailyForecast {
//     date: string;            // "YYYY-MM-DD", location-local (daily.time entry)
//     hiC: number;             // from temperature_2m_max
//     loC: number;             // from temperature_2m_min
//     feelsLikeMaxC: number;   // from apparent_temperature_max
//     weatherCode: number;     // WMO weather_code
//     precipProbability: number; // from precipitation_probability_max (%)
//     windKmh: number;         // from wind_speed_10m_max
//     cloudCover: number;      // from cloud_cover_mean (%)
//     uvIndex: number;         // from uv_index_max
//   }
//
//   export interface Forecast {
//     days: DailyForecast[];
//     hourly: { time: string[]; tempC: number[] };  // tempC from temperature_2m
//     sunrise: string;   // "YYYY-MM-DDTHH:mm", today's, location-local
//     sunset: string;    // "YYYY-MM-DDTHH:mm", today's, location-local
//     timezone: string;  // from response `timezone`
//   }
//
// From `./map`:
//
//   // Discriminated, total result union.
//   export type MapForecastResult =
//     | { ok: true; forecast: Forecast }
//     | { ok: false; reason: string };
//
//   // Pure (TC-PURE-01): no next/*, react, react-dom, DOM globals, no
//   // Math.random / Date.now. TOTAL: defined for every input (incl. null,
//   // undefined, strings, numbers, {}, malformed shapes); NEVER throws.
//   export function mapForecast(json: unknown): MapForecastResult
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { mapForecast } from "./map";

// A well-formed 7-day daily + 48h hourly Open-Meteo body, location-local
// (timezone=auto). Field names are the modern snake_case per
// docs/open-meteo-reference.md (NOT legacy `weathercode`).
function wellFormedResponse() {
  const days = ["2026-06-20", "2026-06-21", "2026-06-22", "2026-06-23", "2026-06-24", "2026-06-25", "2026-06-26"];
  return {
    timezone: "Europe/Kyiv",
    utc_offset_seconds: 10800,
    daily: {
      time: [...days],
      temperature_2m_max: [26, 27, 28, 25, 24, 23, 22],
      temperature_2m_min: [16, 17, 18, 15, 14, 13, 12],
      apparent_temperature_max: [28, 29, 30, 27, 26, 25, 24],
      weather_code: [0, 1, 2, 3, 61, 71, 95],
      precipitation_probability_max: [0, 10, 20, 30, 80, 60, 90],
      wind_speed_10m_max: [5, 8, 12, 15, 20, 10, 18],
      cloud_cover_mean: [10, 30, 50, 70, 90, 60, 100],
      uv_index_max: [6, 5, 4, 3, 2, 1, 0],
      sunrise: days.map((d) => `${d}T05:00`),
      sunset: days.map((d) => `${d}T21:00`),
    },
    hourly: {
      time: Array.from({ length: 48 }, (_, i) => {
        const hour = String(i % 24).padStart(2, "0");
        const day = i < 24 ? "2026-06-20" : "2026-06-21";
        return `${day}T${hour}:00`;
      }),
      temperature_2m: Array.from({ length: 48 }, (_, i) => 15 + (i % 12)),
    },
  };
}

describe("mapForecast — well-formed daily+hourly maps to the domain forecast (FR-FORECAST-01, FR-FORECAST-02)", () => {
  it("returns ok:true with a forecast for a complete 7-day + 48h body", () => {
    const result = mapForecast(wellFormedResponse());

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok:true");
    expect(result.forecast.days).toHaveLength(7);
    expect(result.forecast.hourly.time).toHaveLength(48);
    expect(result.forecast.hourly.tempC).toHaveLength(48);
  });

  it("maps every daily field to the domain DailyForecast with correct values for day 0", () => {
    const result = mapForecast(wellFormedResponse());
    if (!result.ok) throw new Error("expected ok:true");

    expect(result.forecast.days[0]).toEqual({
      date: "2026-06-20",
      hiC: 26,
      loC: 16,
      feelsLikeMaxC: 28,
      weatherCode: 0,
      precipProbability: 0,
      windKmh: 5,
      cloudCover: 10,
      uvIndex: 6,
    });
  });

  it("preserves the chronological order of the daily entries", () => {
    const result = mapForecast(wellFormedResponse());
    if (!result.ok) throw new Error("expected ok:true");

    expect(result.forecast.days.map((d) => d.date)).toEqual([
      "2026-06-20",
      "2026-06-21",
      "2026-06-22",
      "2026-06-23",
      "2026-06-24",
      "2026-06-25",
      "2026-06-26",
    ]);
  });

  it("maps the hourly temperature series into hourly.tempC in chronological order", () => {
    const result = mapForecast(wellFormedResponse());
    if (!result.ok) throw new Error("expected ok:true");

    expect(result.forecast.hourly.tempC[0]).toBe(15);
    expect(result.forecast.hourly.tempC[12]).toBe(15);
    expect(result.forecast.hourly.time[0]).toBe("2026-06-20T00:00");
    expect(result.forecast.hourly.time[47]).toBe("2026-06-21T23:00");
  });

  it("carries today's sunrise/sunset and the timezone through", () => {
    const result = mapForecast(wellFormedResponse());
    if (!result.ok) throw new Error("expected ok:true");

    expect(result.forecast.sunrise).toBe("2026-06-20T05:00");
    expect(result.forecast.sunset).toBe("2026-06-20T21:00");
    expect(result.forecast.timezone).toBe("Europe/Kyiv");
  });

  it("does not mutate the raw input", () => {
    const raw = wellFormedResponse();
    const snapshot = JSON.stringify(raw);

    mapForecast(raw);

    expect(JSON.stringify(raw)).toBe(snapshot);
  });

  it("is deterministic — identical input yields a deep-equal result", () => {
    expect(mapForecast(wellFormedResponse())).toEqual(mapForecast(wellFormedResponse()));
  });
});

describe("mapForecast — partial-but-usable body renders what is available (FR-FORECAST-02)", () => {
  it("returns ok with one day per available well-formed daily entry (3 days)", () => {
    const days = ["2026-06-20", "2026-06-21", "2026-06-22"];
    const result = mapForecast({
      timezone: "Europe/Kyiv",
      daily: {
        time: [...days],
        temperature_2m_max: [26, 27, 28],
        temperature_2m_min: [16, 17, 18],
        apparent_temperature_max: [28, 29, 30],
        weather_code: [0, 1, 2],
        precipitation_probability_max: [0, 10, 20],
        wind_speed_10m_max: [5, 8, 12],
        cloud_cover_mean: [10, 30, 50],
        uv_index_max: [6, 5, 4],
        sunrise: days.map((d) => `${d}T05:00`),
        sunset: days.map((d) => `${d}T21:00`),
      },
      hourly: {
        time: Array.from({ length: 24 }, (_, i) => `2026-06-20T${String(i).padStart(2, "0")}:00`),
        temperature_2m: Array.from({ length: 24 }, (_, i) => 15 + i),
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok:true");
    expect(result.forecast.days).toHaveLength(3);
    expect(result.forecast.days[2].date).toBe("2026-06-22");
  });

  it("returns ok with a single day when only one well-formed daily entry plus usable hourly exist", () => {
    const result = mapForecast({
      timezone: "Europe/Kyiv",
      daily: {
        time: ["2026-06-20"],
        temperature_2m_max: [26],
        temperature_2m_min: [16],
        apparent_temperature_max: [28],
        weather_code: [0],
        precipitation_probability_max: [0],
        wind_speed_10m_max: [5],
        cloud_cover_mean: [10],
        uv_index_max: [6],
        sunrise: ["2026-06-20T05:00"],
        sunset: ["2026-06-20T21:00"],
      },
      hourly: {
        time: ["2026-06-20T00:00", "2026-06-20T01:00"],
        temperature_2m: [15, 16],
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok:true");
    expect(result.forecast.days).toHaveLength(1);
  });
});

describe("mapForecast — failures return ok:false and NEVER throw (FR-FORECAST-01, NFR-OBS-01)", () => {
  // Every assertion proves the mapper degrades to a typed failure the caller can
  // route to the calm inline state, rather than throwing into a generic 500.

  it("returns ok:false for an empty daily array (no usable days)", () => {
    const result = mapForecast({
      timezone: "Europe/Kyiv",
      daily: {
        time: [],
        temperature_2m_max: [],
        temperature_2m_min: [],
        apparent_temperature_max: [],
        weather_code: [],
        precipitation_probability_max: [],
        wind_speed_10m_max: [],
        cloud_cover_mean: [],
        uv_index_max: [],
        sunrise: [],
        sunset: [],
      },
      hourly: { time: ["2026-06-20T00:00"], temperature_2m: [15] },
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok:false when the daily object is missing entirely", () => {
    const result = mapForecast({
      timezone: "Europe/Kyiv",
      hourly: { time: ["2026-06-20T00:00"], temperature_2m: [15] },
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok:false when hourly temperatures are missing", () => {
    const result = mapForecast({
      timezone: "Europe/Kyiv",
      daily: {
        time: ["2026-06-20"],
        temperature_2m_max: [26],
        temperature_2m_min: [16],
        apparent_temperature_max: [28],
        weather_code: [0],
        precipitation_probability_max: [0],
        wind_speed_10m_max: [5],
        cloud_cover_mean: [10],
        uv_index_max: [6],
        sunrise: ["2026-06-20T05:00"],
        sunset: ["2026-06-20T21:00"],
      },
      hourly: { time: ["2026-06-20T00:00"] },
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok:false when the hourly temperature array is empty", () => {
    const result = mapForecast({
      timezone: "Europe/Kyiv",
      daily: {
        time: ["2026-06-20"],
        temperature_2m_max: [26],
        temperature_2m_min: [16],
        apparent_temperature_max: [28],
        weather_code: [0],
        precipitation_probability_max: [0],
        wind_speed_10m_max: [5],
        cloud_cover_mean: [10],
        uv_index_max: [6],
        sunrise: ["2026-06-20T05:00"],
        sunset: ["2026-06-20T21:00"],
      },
      hourly: { time: [], temperature_2m: [] },
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok:false when today's sunrise is null", () => {
    const result = mapForecast({
      timezone: "Europe/Kyiv",
      daily: {
        time: ["2026-06-20"],
        temperature_2m_max: [26],
        temperature_2m_min: [16],
        apparent_temperature_max: [28],
        weather_code: [0],
        precipitation_probability_max: [0],
        wind_speed_10m_max: [5],
        cloud_cover_mean: [10],
        uv_index_max: [6],
        sunrise: [null],
        sunset: ["2026-06-20T21:00"],
      },
      hourly: { time: ["2026-06-20T00:00"], temperature_2m: [15] },
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok:false when today's sunset is null", () => {
    const result = mapForecast({
      timezone: "Europe/Kyiv",
      daily: {
        time: ["2026-06-20"],
        temperature_2m_max: [26],
        temperature_2m_min: [16],
        apparent_temperature_max: [28],
        weather_code: [0],
        precipitation_probability_max: [0],
        wind_speed_10m_max: [5],
        cloud_cover_mean: [10],
        uv_index_max: [6],
        sunrise: ["2026-06-20T05:00"],
        sunset: [null],
      },
      hourly: { time: ["2026-06-20T00:00"], temperature_2m: [15] },
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok:false when sunrise/sunset arrays are absent", () => {
    const result = mapForecast({
      timezone: "Europe/Kyiv",
      daily: {
        time: ["2026-06-20"],
        temperature_2m_max: [26],
        temperature_2m_min: [16],
        apparent_temperature_max: [28],
        weather_code: [0],
        precipitation_probability_max: [0],
        wind_speed_10m_max: [5],
        cloud_cover_mean: [10],
        uv_index_max: [6],
      },
      hourly: { time: ["2026-06-20T00:00"], temperature_2m: [15] },
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok:false (never throws) for each malformed / unparseable input", () => {
    const malformed: unknown[] = [
      null,
      undefined,
      {},
      [],
      42,
      "not json",
      true,
      { daily: null, hourly: null },
      { daily: "nope", hourly: "nope" },
      { daily: { time: "not-an-array" }, hourly: {} },
      { daily: { time: ["2026-06-20"] } }, // no parallel arrays, no hourly
    ];

    for (const input of malformed) {
      // The whole point: invoking the mapper must not throw for any input.
      const run = () => mapForecast(input);
      expect(run).not.toThrow();
      expect(run().ok).toBe(false);
    }
  });

  it("never throws even when daily field arrays contain non-numeric junk", () => {
    const run = () =>
      mapForecast({
        timezone: "Europe/Kyiv",
        daily: {
          time: ["2026-06-20"],
          temperature_2m_max: ["hot"],
          temperature_2m_min: [null],
          apparent_temperature_max: [undefined],
          weather_code: ["x"],
          precipitation_probability_max: [{}],
          wind_speed_10m_max: [[]],
          cloud_cover_mean: ["NaN"],
          uv_index_max: [Infinity],
          sunrise: ["2026-06-20T05:00"],
          sunset: ["2026-06-20T21:00"],
        },
        hourly: { time: ["2026-06-20T00:00"], temperature_2m: [15] },
      });

    expect(run).not.toThrow();
    // A day whose required numeric fields are unusable is not a well-formed day,
    // so with no well-formed days the mapper reports failure rather than emitting
    // a NaN-filled card.
    expect(run().ok).toBe(false);
  });
});
