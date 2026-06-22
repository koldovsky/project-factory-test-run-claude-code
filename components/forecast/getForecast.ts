import { cache } from "react";

import { fetchForecast } from "@/lib/weather";

// Request-scoped forecast read (FR-FORECAST-05, design decision 2).
//
// React `cache()` memoizes by argument within a single render pass: reading the
// SAME coordinates again in one request reuses the result (no second Open-Meteo
// call), while a location change (new coords / new render) fetches fresh. This
// is request-scoped by construction — NOT a process-wide mutable map shared
// across users or unrelated requests, so one reader's forecast is never served
// to a different reader (spec "Cache is not a process-wide store").
//
// This module is imported ONLY from Server Components, so the keyless Open-Meteo
// call never enters the client bundle (TC-DATA-01).

export const getForecast = cache(
  (lat: number, lon: number) => fetchForecast(lat, lon),
);
