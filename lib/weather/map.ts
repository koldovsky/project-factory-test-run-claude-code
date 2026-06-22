// Pure, total Open-Meteo forecast response → domain `Forecast` mapper
// (FR-FORECAST-01, FR-FORECAST-02, TC-PURE-01, TC-DATA-01).
//
// Framework-free: no next/*, react, react-dom, or DOM globals; no Math.random /
// Date.now. Deterministic, non-mutating, and TOTAL — defined for every input
// (incl. null, undefined, strings, numbers, {}, malformed shapes) and NEVER
// throws. Any non-happy outcome is a typed `{ ok: false; reason }` the caller
// routes to the same calm inline state (NFR-OBS-01).
//
// "Well-formed enough to render" rule (spec "render what you have"):
//   - `daily` is an object with a non-empty `time` array of "YYYY-MM-DD" strings;
//   - day 0's `sunrise` and `sunset` are non-null "YYYY-MM-DDTHH:mm" strings;
//   - `hourly.temperature_2m` is a non-empty array of finite numbers;
//   - at least one daily index has ALL nine required numeric fields finite.
// A partial body (≥1 well-formed day + usable hourly) maps to the available
// days. Empty/missing/incomplete/malformed → `{ ok: false }`.

import type { DailyForecast, Forecast } from "./types";

export type MapForecastResult =
  | { ok: true; forecast: Forecast }
  | { ok: false; reason: string };

/** A finite JS number, or null when the value is not a usable number. */
function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** A non-empty trimmed string, or null otherwise (used for time stamps). */
function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.length > 0 ? value : null;
}

/** Read a property off an unknown value without throwing on non-objects. */
function prop(source: unknown, key: string): unknown {
  if (source === null || typeof source !== "object") return undefined;
  return (source as Record<string, unknown>)[key];
}

const fail = (reason: string): MapForecastResult => ({ ok: false, reason });

export function mapForecast(json: unknown): MapForecastResult {
  if (json === null || typeof json !== "object" || Array.isArray(json)) {
    return fail("not-an-object");
  }

  // --- Hourly temperature series (required, non-empty) ---------------------
  const hourly = prop(json, "hourly");
  const hourlyTempsRaw = prop(hourly, "temperature_2m");
  const hourlyTimeRaw = prop(hourly, "time");
  if (!Array.isArray(hourlyTempsRaw) || hourlyTempsRaw.length === 0) {
    return fail("hourly-temperature-missing");
  }
  const hourlyTempC: number[] = [];
  for (const value of hourlyTempsRaw) {
    const n = finiteNumber(value);
    if (n === null) return fail("hourly-temperature-invalid");
    hourlyTempC.push(n);
  }
  const hourlyTime: string[] = Array.isArray(hourlyTimeRaw)
    ? hourlyTimeRaw.map((entry) => (typeof entry === "string" ? entry : ""))
    : [];

  // --- Daily block (required) ---------------------------------------------
  const daily = prop(json, "daily");
  if (daily === null || typeof daily !== "object") return fail("daily-missing");

  const time = prop(daily, "time");
  if (!Array.isArray(time) || time.length === 0) return fail("daily-empty");

  // Day 0's sun times must be present, non-null strings (spec failure case).
  const sunriseArr = prop(daily, "sunrise");
  const sunsetArr = prop(daily, "sunset");
  const sunrise = Array.isArray(sunriseArr) ? nonEmptyString(sunriseArr[0]) : null;
  const sunset = Array.isArray(sunsetArr) ? nonEmptyString(sunsetArr[0]) : null;
  if (sunrise === null) return fail("sunrise-missing");
  if (sunset === null) return fail("sunset-missing");

  // Parallel numeric daily arrays. Missing arrays simply yield no usable day.
  const maxArr = prop(daily, "temperature_2m_max");
  const minArr = prop(daily, "temperature_2m_min");
  const feelsArr = prop(daily, "apparent_temperature_max");
  const codeArr = prop(daily, "weather_code");
  const precipArr = prop(daily, "precipitation_probability_max");
  const windArr = prop(daily, "wind_speed_10m_max");
  const cloudArr = prop(daily, "cloud_cover_mean");
  const uvArr = prop(daily, "uv_index_max");

  const at = (arr: unknown, index: number): unknown =>
    Array.isArray(arr) ? arr[index] : undefined;

  const days: DailyForecast[] = [];
  for (let i = 0; i < time.length; i += 1) {
    const date = nonEmptyString(time[i]);
    if (date === null) continue;

    const hiC = finiteNumber(at(maxArr, i));
    const loC = finiteNumber(at(minArr, i));
    const weatherCode = finiteNumber(at(codeArr, i));

    // CORE render fields only. A day is well-formed if it has a date, hi/lo, and
    // a weather code (always present for a forecast day). The other fields are
    // optional: Open-Meteo returns null for precip-probability / UV beyond their
    // horizon, so coerce a missing/non-finite value to null (a calm placeholder
    // in the card; comfortScore uses its neutral defaults) rather than dropping
    // the day or failing the whole forecast (review-gate finding).
    if (hiC === null || loC === null || weatherCode === null) {
      continue;
    }

    days.push({
      date,
      hiC,
      loC,
      weatherCode,
      feelsLikeMaxC: finiteNumber(at(feelsArr, i)),
      precipProbability: finiteNumber(at(precipArr, i)),
      windKmh: finiteNumber(at(windArr, i)),
      cloudCover: finiteNumber(at(cloudArr, i)),
      uvIndex: finiteNumber(at(uvArr, i)),
    });
  }

  if (days.length === 0) return fail("no-usable-daily");

  const timezone = nonEmptyString(prop(json, "timezone")) ?? "";

  const forecast: Forecast = {
    days,
    hourly: { time: hourlyTime, tempC: hourlyTempC },
    sunrise,
    sunset,
    timezone,
  };

  return { ok: true, forecast };
}
