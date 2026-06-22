// Forecast domain types (TC-PURE-01: framework-free — no next/*, react, DOM).
//
// The shapes the Open-Meteo forecast response is mapped INTO by `mapForecast`
// (see `./map`). Field names are the domain names used by the day cards / chart;
// the snake_case Open-Meteo source field for each is noted inline so the mapper
// and the cards can never drift (docs/open-meteo-reference.md).

/** One mapped forecast day, location-local (from a `daily.time` entry). */
export interface DailyForecast {
  /** "YYYY-MM-DD", location-local (the `daily.time` entry). */
  date: string;
  /** High temperature in °C (from `temperature_2m_max`). */
  hiC: number;
  /** Low temperature in °C (from `temperature_2m_min`). */
  loC: number;
  /** Feels-like maximum in °C (from `apparent_temperature_max`). */
  feelsLikeMaxC: number;
  /** WMO weather code (from `weather_code`). */
  weatherCode: number;
  /** Precipitation probability % (from `precipitation_probability_max`). */
  precipProbability: number;
  /** Wind speed km/h (from `wind_speed_10m_max`). */
  windKmh: number;
  /** Cloud cover % (from `cloud_cover_mean`). */
  cloudCover: number;
  /** UV index (from `uv_index_max`). */
  uvIndex: number;
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
