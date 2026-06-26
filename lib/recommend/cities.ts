// Curated set of Ukraine's main cities — oblast administrative centres + Kyiv —
// used as the candidate pool for the Day 03 "where to go" recommendation
// (see docs/day-03-skills-demo.md). Coordinates are PRE-STORED so a
// recommendation never needs a geocoding network call; the only live dependency
// is the keyless Open-Meteo forecast fetch.
//
// EXCLUDED by design: Crimea (Simferopol, Sevastopol), Donetsk, Luhansk.
//
// Framework-free (TC-PURE-01): no next/*, react, react-dom, or DOM imports.

/** What a city is naturally good for (every city is a valid "city" break).
 *  Kept as descriptive metadata the agent can use as a hint (e.g. coastal cities
 *  for «до моря»); the agent-ranked flow does not branch on it automatically. */
export type Affinity = "sea" | "mountains" | "city";

export interface Candidate {
  /** Ukrainian display name — also the deep-link `?name=`. */
  nameUk: string;
  /** Latin name — stable key for tests / tie-breaks. */
  nameEn: string;
  lat: number;
  lon: number;
  /** Trip affinities; always includes "city". */
  affinities: Affinity[];
}

// 22 cities. Coastal (Black-Sea-facing) → "sea"; Carpathian-gateway → "mountains".
export const CITIES: readonly Candidate[] = [
  { nameUk: "Київ", nameEn: "Kyiv", lat: 50.4501, lon: 30.5234, affinities: ["city"] },
  { nameUk: "Львів", nameEn: "Lviv", lat: 49.8397, lon: 24.0297, affinities: ["city"] },
  { nameUk: "Одеса", nameEn: "Odesa", lat: 46.4825, lon: 30.7233, affinities: ["city", "sea"] },
  { nameUk: "Харків", nameEn: "Kharkiv", lat: 49.9935, lon: 36.2304, affinities: ["city"] },
  { nameUk: "Дніпро", nameEn: "Dnipro", lat: 48.4647, lon: 35.0462, affinities: ["city"] },
  { nameUk: "Запоріжжя", nameEn: "Zaporizhzhia", lat: 47.8388, lon: 35.1396, affinities: ["city"] },
  { nameUk: "Вінниця", nameEn: "Vinnytsia", lat: 49.2331, lon: 28.4682, affinities: ["city"] },
  { nameUk: "Полтава", nameEn: "Poltava", lat: 49.5883, lon: 34.5514, affinities: ["city"] },
  { nameUk: "Чернігів", nameEn: "Chernihiv", lat: 51.4982, lon: 31.2893, affinities: ["city"] },
  { nameUk: "Черкаси", nameEn: "Cherkasy", lat: 49.4444, lon: 32.0598, affinities: ["city"] },
  { nameUk: "Суми", nameEn: "Sumy", lat: 50.9077, lon: 34.7981, affinities: ["city"] },
  { nameUk: "Житомир", nameEn: "Zhytomyr", lat: 50.2547, lon: 28.6587, affinities: ["city"] },
  { nameUk: "Хмельницький", nameEn: "Khmelnytskyi", lat: 49.4229, lon: 26.9871, affinities: ["city"] },
  { nameUk: "Рівне", nameEn: "Rivne", lat: 50.6199, lon: 26.2516, affinities: ["city"] },
  { nameUk: "Луцьк", nameEn: "Lutsk", lat: 50.7472, lon: 25.3254, affinities: ["city"] },
  { nameUk: "Тернопіль", nameEn: "Ternopil", lat: 49.5535, lon: 25.5948, affinities: ["city"] },
  { nameUk: "Івано-Франківськ", nameEn: "Ivano-Frankivsk", lat: 48.9226, lon: 24.7111, affinities: ["city", "mountains"] },
  { nameUk: "Ужгород", nameEn: "Uzhhorod", lat: 48.6208, lon: 22.2879, affinities: ["city", "mountains"] },
  { nameUk: "Чернівці", nameEn: "Chernivtsi", lat: 48.2917, lon: 25.9352, affinities: ["city", "mountains"] },
  { nameUk: "Миколаїв", nameEn: "Mykolaiv", lat: 46.9750, lon: 31.9946, affinities: ["city", "sea"] },
  { nameUk: "Херсон", nameEn: "Kherson", lat: 46.6354, lon: 32.6169, affinities: ["city", "sea"] },
  { nameUk: "Кропивницький", nameEn: "Kropyvnytskyi", lat: 48.5079, lon: 32.2623, affinities: ["city"] },
];
