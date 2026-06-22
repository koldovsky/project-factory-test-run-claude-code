// Forecast domain types (TC-PURE-01: framework-free — no next/*, react, DOM).
//
// The shapes the Open-Meteo forecast response is mapped INTO by `mapForecast`
// (see `./map`). Field names are the domain names used by the day cards / chart;
// the snake_case Open-Meteo source field for each is noted inline so the mapper
// and the cards can never drift (docs/open-meteo-reference.md).

// A day renders as long as its CORE fields are present (date, hi/lo, weather
// code). The remaining fields are `number | null`: Open-Meteo routinely returns
// null for `precipitation_probability_max` / `uv_index_max` beyond their horizon,
// so they must NOT drop the day or fail the forecast — the card shows a calm
// placeholder and `comfortScore` (which tolerates missing inputs) uses its
// neutral defaults (review-gate finding).
/** One mapped forecast day, location-local (from a `daily.time` entry). */
export interface DailyForecast {
  /** "YYYY-MM-DD", location-local (the `daily.time` entry). */
  date: string;
  /** High temperature in °C (from `temperature_2m_max`). */
  hiC: number;
  /** Low temperature in °C (from `temperature_2m_min`). */
  loC: number;
  /** WMO weather code (from `weather_code`). */
  weatherCode: number;
  /** Feels-like maximum in °C (from `apparent_temperature_max`); null if absent. */
  feelsLikeMaxC: number | null;
  /** Precipitation probability % (from `precipitation_probability_max`); null beyond horizon. */
  precipProbability: number | null;
  /** Wind speed km/h (from `wind_speed_10m_max`); null if absent. */
  windKmh: number | null;
  /** Cloud cover % (from `cloud_cover_mean`); null if absent. */
  cloudCover: number | null;
  /** UV index (from `uv_index_max`); null beyond horizon. */
  uvIndex: number | null;
}

/** The full mapped forecast for an active location. */
export interface Forecast {
  /** One entry per well-formed daily day, chronological order. */
  days: DailyForecast[];
  /** Next-48h hourly temperature series (parallel arrays). */
  hourly: {
    /** "YYYY-MM-DDTHH:mm", location-local (from `hourly.time`). */
    time: string[];
    /** °C series (from `hourly.temperature_2m`). */
    tempC: number[];
  };
  /** Today's sunrise "YYYY-MM-DDTHH:mm", location-local (day-0 `sunrise`). */
  sunrise: string;
  /** Today's sunset "YYYY-MM-DDTHH:mm", location-local (day-0 `sunset`). */
  sunset: string;
  /** Response `timezone` (IANA name, e.g. "Europe/Kyiv"). */
  timezone: string;
}
