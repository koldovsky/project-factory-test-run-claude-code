// Pure, total WMO `weather_code` → icon key + Ukrainian condition name
// (FR-FORECAST-02, TC-PURE-01, BC-BRAND-01).
//
// Framework-free: no next/*, react, or DOM. TOTAL: every input (incl. unknown
// codes, negatives, huge values, NaN, non-integers) returns a usable
// `WeatherCondition`; NEVER throws. The `label` is the icon's accessible alt
// text — natural Ukrainian, calm, no "!" and no emoji.
//
// WMO groups (docs/open-meteo-reference.md):
//   0 clear · 1 mainly clear · 2 partly cloudy · 3 overcast · 45,48 fog ·
//   51-57 drizzle · 61-67 rain · 71-77 snow · 80-82 rain showers ·
//   85,86 snow showers · 95 thunderstorm · 96,99 thunderstorm with hail.

export interface WeatherCondition {
  /** Stable icon key the DayCard maps to an icon asset/component. */
  icon: string;
  /** Ukrainian condition name — the icon's accessible alt text. */
  label: string;
}

// Each distinct condition is defined once and shared by every code in its group,
// so equal conditions are deeply equal (45≡48, 96≡99) and distinct conditions
// never collapse to the same icon.
const CLEAR: WeatherCondition = { icon: "clear", label: "ясно" };
const MAINLY_CLEAR: WeatherCondition = { icon: "mainly-clear", label: "переважно ясно" };
const PARTLY_CLOUDY: WeatherCondition = { icon: "partly-cloudy", label: "мінлива хмарність" };
const OVERCAST: WeatherCondition = { icon: "overcast", label: "хмарно" };
const FOG: WeatherCondition = { icon: "fog", label: "туман" };
const DRIZZLE: WeatherCondition = { icon: "drizzle", label: "мряка" };
const RAIN: WeatherCondition = { icon: "rain", label: "дощ" };
const SNOW: WeatherCondition = { icon: "snow", label: "сніг" };
const RAIN_SHOWERS: WeatherCondition = { icon: "rain-showers", label: "зливи" };
const SNOW_SHOWERS: WeatherCondition = { icon: "snow-showers", label: "снігопад" };
const THUNDERSTORM: WeatherCondition = { icon: "thunderstorm", label: "гроза" };
const THUNDERSTORM_HAIL: WeatherCondition = { icon: "thunderstorm-hail", label: "гроза з градом" };

// Fallback for unknown / out-of-range / non-integer codes: a calm, neutral
// Ukrainian phrase so the day card always has usable alt text.
const UNKNOWN: WeatherCondition = { icon: "unknown", label: "невідомі умови" };

// Direct lookup for the codes Open-Meteo emits. Ranges (drizzle / rain / snow /
// showers) are listed explicitly so an out-of-set code falls through to UNKNOWN.
const BY_CODE = new Map<number, WeatherCondition>([
  [0, CLEAR],
  [1, MAINLY_CLEAR],
  [2, PARTLY_CLOUDY],
  [3, OVERCAST],
  [45, FOG],
  [48, FOG],
  [51, DRIZZLE],
  [53, DRIZZLE],
  [55, DRIZZLE],
  [56, DRIZZLE],
  [57, DRIZZLE],
  [61, RAIN],
  [63, RAIN],
  [65, RAIN],
  [66, RAIN],
  [67, RAIN],
  [71, SNOW],
  [73, SNOW],
  [75, SNOW],
  [77, SNOW],
  [80, RAIN_SHOWERS],
  [81, RAIN_SHOWERS],
  [82, RAIN_SHOWERS],
  [85, SNOW_SHOWERS],
  [86, SNOW_SHOWERS],
  [95, THUNDERSTORM],
  [96, THUNDERSTORM_HAIL],
  [99, THUNDERSTORM_HAIL],
]);

export function weatherCodeToCondition(code: number): WeatherCondition {
  if (typeof code !== "number" || !Number.isInteger(code)) return UNKNOWN;
  return BY_CODE.get(code) ?? UNKNOWN;
}
