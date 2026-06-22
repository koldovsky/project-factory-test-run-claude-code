// Public surface of the pure `lib/weather` modules (TC-PURE-01). App/route
// consumers import from here; the unit tests import the per-file modules
// (`./map`, `./code`, `./weekday`) directly. No next/react/DOM imports.

export type { DailyForecast, Forecast } from "./types";
export { mapForecast } from "./map";
export type { MapForecastResult } from "./map";
export { weatherCodeToCondition } from "./code";
export type { WeatherCondition } from "./code";
export { ukWeekday } from "./weekday";
export { weekendDays } from "./weekendDays";
export { fetchForecast, buildForecastUrl } from "./fetchForecast";
