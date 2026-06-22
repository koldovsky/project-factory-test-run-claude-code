// Deterministic Open-Meteo fixture objects + a fetch stub for the Phase 5
// cross-cutting integration layer (ADR-0001: keyless, DB-free, auth-free — there
// is no database or seed, so the deterministic-fixture equivalent is *recorded
// Open-Meteo response objects*). Shapes match docs/open-meteo-reference.md
// EXACTLY (modern snake_case field names — `weather_code`, NOT `weathercode`).
//
// This is a shared module (NOT a *.test.ts): it holds no assertions, only the
// fixture bodies and the `stubFetch` helper the integration specs import.
//
// Calendar choice: the 7-day daily window is 2026-06-19 .. 2026-06-25, which
// contains Saturday 2026-06-20 and Sunday 2026-06-21 (verified against the
// existing lib/scoring/weekend.test.ts), so the weekend selection + average are
// exercised. Dates are LOCAL calendar strings (timezone=auto), never UTC slices.

import { vi } from "vitest";

// --- Geocoding fixtures -----------------------------------------------------

/**
 * A realistic forward-geocoding body for "Kyiv" with two Ukrainian cities. Field
 * names are the Open-Meteo geocoding result fields (docs/open-meteo-reference.md
 * §Geocoding): name, latitude, longitude, country, country_code, admin1, plus the
 * tolerated extras (id, elevation, timezone, feature_code, population) so the
 * fixture mirrors a true response and proves the mapper ignores unknown fields.
 */
export const geocodeFixture = {
  generationtime_ms: 0.42,
  results: [
    {
      id: 703448,
      name: "Київ",
      latitude: 50.45466,
      longitude: 30.5238,
      elevation: 187,
      feature_code: "PPLC",
      country_code: "UA",
      timezone: "Europe/Kyiv",
      population: 2797553,
      country: "Україна",
      admin1: "Київ",
    },
    {
      id: 702550,
      name: "Львів",
      latitude: 49.83826,
      longitude: 24.02324,
      elevation: 296,
      feature_code: "PPLA",
      country_code: "UA",
      timezone: "Europe/Kyiv",
      population: 717273,
      country: "Україна",
      admin1: "Львівська область",
    },
  ],
} as const;

/**
 * Zero-results body. Open-Meteo OMITS the `results` key entirely on no match —
 * the body is just `generationtime_ms`. `lib/geo` must treat a missing `results`
 * as zero results (inline "Nothing found", never an error / throw).
 */
export const geocodeEmptyFixture = {
  generationtime_ms: 0.13,
} as const;

// --- Forecast fixtures ------------------------------------------------------

/** The 7 LOCAL daily dates: Fri .. Thu, including Sat 06-20 + Sun 06-21. */
const DAILY_TIME = [
  "2026-06-19", // Fri
  "2026-06-20", // Sat  (weekend)
  "2026-06-21", // Sun  (weekend)
  "2026-06-22", // Mon
  "2026-06-23", // Tue
  "2026-06-24", // Wed
  "2026-06-25", // Thu
] as const;

/** Build 48 parallel "YYYY-MM-DDTHH:mm" hourly stamps from day 0 + day 1. */
function buildHourlyTime(): string[] {
  const out: string[] = [];
  for (let day = 0; day < 2; day += 1) {
    const date = DAILY_TIME[day];
    for (let hour = 0; hour < 24; hour += 1) {
      out.push(`${date}T${String(hour).padStart(2, "0")}:00`);
    }
  }
  return out;
}

/** A gentle diurnal temperature curve, 48 finite °C values. */
function buildHourlyTemps(): number[] {
  const out: number[] = [];
  for (let i = 0; i < 48; i += 1) {
    const hourOfDay = i % 24;
    // Coolest ~05:00, warmest ~15:00; amplitude 7 °C around a 19 °C mean.
    const phase = ((hourOfDay - 9) / 24) * Math.PI * 2;
    out.push(Math.round((19 + 7 * Math.sin(phase)) * 10) / 10);
  }
  return out;
}

const HOURLY_TIME = buildHourlyTime();
const HOURLY_TEMP = buildHourlyTemps();

/**
 * A well-formed 7-day daily + 48h hourly forecast body. Every daily array has
 * length 7 and every value is finite; the hourly arrays have length 48. Sunrise
 * and sunset are non-null location-local "YYYY-MM-DDTHH:mm" strings. The day-1
 * (Saturday) / day-2 (Sunday) values are deliberately distinct so the weekend
 * average is not trivially symmetric.
 */
export const forecastFixture = {
  latitude: 50.45,
  longitude: 30.52,
  timezone: "Europe/Kyiv",
  utc_offset_seconds: 10800,
  daily_units: {
    time: "iso8601",
    temperature_2m_max: "°C",
    temperature_2m_min: "°C",
    apparent_temperature_max: "°C",
    weather_code: "wmo code",
    precipitation_probability_max: "%",
    wind_speed_10m_max: "km/h",
    cloud_cover_mean: "%",
    uv_index_max: "",
    sunrise: "iso8601",
    sunset: "iso8601",
  },
  daily: {
    time: [...DAILY_TIME],
    temperature_2m_max: [22.4, 26.1, 19.8, 24.0, 27.3, 18.5, 21.0],
    temperature_2m_min: [12.1, 15.0, 11.2, 13.6, 16.4, 9.8, 11.5],
    apparent_temperature_max: [21.8, 25.5, 18.9, 23.4, 28.0, 17.2, 20.4],
    weather_code: [1, 0, 61, 2, 0, 80, 3],
    precipitation_probability_max: [10, 5, 80, 20, 0, 65, 35],
    wind_speed_10m_max: [11.5, 8.2, 22.0, 14.0, 9.0, 28.5, 16.0],
    cloud_cover_mean: [25, 5, 90, 40, 0, 75, 60],
    uv_index_max: [5.2, 6.8, 3.1, 5.5, 7.0, 2.4, 4.0],
    sunrise: [
      "2026-06-19T04:46",
      "2026-06-20T04:46",
      "2026-06-21T04:46",
      "2026-06-22T04:47",
      "2026-06-23T04:47",
      "2026-06-24T04:48",
      "2026-06-25T04:48",
    ],
    sunset: [
      "2026-06-19T21:11",
      "2026-06-20T21:11",
      "2026-06-21T21:12",
      "2026-06-22T21:12",
      "2026-06-23T21:12",
      "2026-06-24T21:12",
      "2026-06-25T21:12",
    ],
  },
  hourly_units: { time: "iso8601", temperature_2m: "°C" },
  hourly: {
    time: HOURLY_TIME,
    temperature_2m: HOURLY_TEMP,
  },
} as const;

/**
 * Like `forecastFixture` but with the "beyond-horizon" case: Open-Meteo returns
 * `null` for some `precipitation_probability_max` / `uv_index_max` entries past
 * the model horizon. The days must still map (kept, not dropped) and comfort
 * must fall back to its neutral defaults for the null inputs.
 */
export const forecastNullHorizonFixture = {
  ...forecastFixture,
  daily: {
    ...forecastFixture.daily,
    time: [...DAILY_TIME],
    // Saturday (idx 1) + the last two days carry null horizon values.
    precipitation_probability_max: [10, null, 80, 20, 0, null, null],
    uv_index_max: [5.2, null, 3.1, 5.5, 7.0, null, null],
  },
} as const;

// --- Fetch stub -------------------------------------------------------------

/** A minimal recorded upstream response for one URL substring. */
export interface StubResponse {
  /** HTTP ok flag the handlers check (`res.ok`). */
  ok?: boolean;
  /** HTTP status (defaults to 200 when ok, 502 otherwise). */
  status?: number;
  /** The JSON body returned by `res.json()`. */
  body: unknown;
}

/** A map from a URL substring to the recorded response to serve for it. */
export type StubMap = Record<string, StubResponse>;

/** Restore handle returned by `stubFetch`. */
export interface FetchStub {
  /** The `vi.fn` installed as `globalThis.fetch` (inspect calls on it). */
  fn: ReturnType<typeof vi.fn>;
  /** Restore the original `globalThis.fetch`. Call in afterEach. */
  restore: () => void;
}

/**
 * Replace `globalThis.fetch` with a `vi.fn` that selects a recorded response by
 * matching the requested URL against the keys of `map` (substring match). The
 * returned object exposes the spy (`fn`) so a test can assert the outgoing URL
 * (e.g. that it carries NO api key/secret) and `restore()` for afterEach.
 *
 * An unmatched URL resolves to a calm `ok:false` 502 so a misconfigured test
 * surfaces as a handled failure rather than a hang.
 */
export function stubFetch(map: StubMap): FetchStub {
  const original = globalThis.fetch;

  const fn = vi.fn(async (input: unknown): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input instanceof Request
            ? input.url
            : String(input);

    const match = Object.entries(map).find(([key]) => url.includes(key));
    const stub: StubResponse = match
      ? match[1]
      : { ok: false, status: 502, body: { error: "no-stub" } };

    const ok = stub.ok ?? true;
    const status = stub.status ?? (ok ? 200 : 502);

    // A structurally-real Response-like object: only the surface the handlers
    // and lib actually read (`ok`, `status`, `json()`).
    return {
      ok,
      status,
      json: async () => stub.body,
    } as Response;
  });

  globalThis.fetch = fn as unknown as typeof fetch;

  return {
    fn,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

/** Open-Meteo endpoint substrings the stub map keys against. */
export const GEOCODE_HOST = "geocoding-api.open-meteo.com";
export const FORECAST_HOST = "api.open-meteo.com/v1/forecast";
