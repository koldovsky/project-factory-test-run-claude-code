// Self-contained "holiday-weather" skill — Day 03 Part 3 (docs/day-03-skills-demo.md §5).
//
// ZERO dependencies: plain Node + global fetch. It vendors its own city list,
// fetches Open-Meteo directly, and prints a weather table that the AGENT ranks for
// the user's criterion. No app, no lib, no build, no API key. Copy this folder
// into any harness's skills dir (Claude Code / Hermes / OpenClaw) and it works.
//
//   node run.mjs '{"when":"this-weekend"}'
//   node run.mjs '{"dates":["2026-06-27","2026-06-28"]}'
//
// when ∈ today | tomorrow | this-weekend | next-3-days (default this-weekend).

// --- Ukraine's main cities (oblast centres + Kyiv); coords pre-stored. -------
// Excludes Crimea / Donetsk / Luhansk. Vendored so the skill needs no geocoding.
const CITIES = [
  ["Київ", 50.4501, 30.5234], ["Львів", 49.8397, 24.0297], ["Одеса", 46.4825, 30.7233],
  ["Харків", 49.9935, 36.2304], ["Дніпро", 48.4647, 35.0462], ["Запоріжжя", 47.8388, 35.1396],
  ["Вінниця", 49.2331, 28.4682], ["Полтава", 49.5883, 34.5514], ["Чернігів", 51.4982, 31.2893],
  ["Черкаси", 49.4444, 32.0598], ["Суми", 50.9077, 34.7981], ["Житомир", 50.2547, 28.6587],
  ["Хмельницький", 49.4229, 26.9871], ["Рівне", 50.6199, 26.2516], ["Луцьк", 50.7472, 25.3254],
  ["Тернопіль", 49.5535, 25.5948], ["Івано-Франківськ", 48.9226, 24.7111], ["Ужгород", 48.6208, 22.2879],
  ["Чернівці", 48.2917, 25.9352], ["Миколаїв", 46.9750, 31.9946], ["Херсон", 46.6354, 32.6169],
  ["Кропивницький", 48.5079, 32.2623],
];

// --- date resolution (within the 7-day forecast horizon) --------------------
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function datesFromWhen(when, today) {
  if (when === "today") return [ymd(today)];
  if (when === "tomorrow") return [ymd(addDays(today, 1))];
  if (when === "next-3-days") return [ymd(today), ymd(addDays(today, 1)), ymd(addDays(today, 2))];
  const sat = addDays(today, (6 - today.getDay() + 7) % 7); // this-weekend
  return [ymd(sat), ymd(addDays(sat, 1))];
}

function resolveDates(arg, today) {
  if (Array.isArray(arg.dates)) {
    const explicit = arg.dates.filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (explicit.length) return Array.from(new Set(explicit)).slice(0, 14);
  }
  const known = ["today", "tomorrow", "this-weekend", "next-3-days"];
  const when = String(arg.when ?? "this-weekend");
  return datesFromWhen(known.includes(when) ? when : "this-weekend", today);
}

// --- Open-Meteo multi-coordinate fetch (keyless) ----------------------------
const DAILY = [
  "apparent_temperature_max", "temperature_2m_max", "precipitation_probability_max",
  "wind_speed_10m_max", "cloud_cover_mean",
].join(",");

async function fetchAll() {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", CITIES.map((c) => c[1]).join(","));
  url.searchParams.set("longitude", CITIES.map((c) => c[2]).join(","));
  url.searchParams.set("daily", DAILY);
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = await res.json();
  return Array.isArray(json) ? json : [json];
}

// --- compact comfort hint (0..100): feels-like dominant, dry/calm/clear ------
const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const num = (v, f) => (typeof v === "number" && Number.isFinite(v) ? v : f);

function comfort(feels, precip, wind, cloud) {
  const f = num(feels, 18), p = num(precip, 20), w = num(wind, 10), c = num(cloud, 50);
  const fs = f >= 18 && f <= 24 ? 1 : f < 18 ? clamp01((f + 10) / 28) : clamp01((40 - f) / 16);
  const ps = clamp01(1 - p / 100);
  const ws = w <= 12 ? 1 : clamp01((75 - w) / 63);
  const cs = clamp01(1 - (c / 100) * 0.6);
  return Math.round((fs * 0.45 + ps * 0.3 + ws * 0.15 + cs * 0.1) * 100);
}

async function main() {
  let arg = {};
  if (process.argv[2]) {
    try { arg = JSON.parse(process.argv[2]); } catch { console.error("Invalid JSON argument."); process.exit(1); }
    if (!arg || typeof arg !== "object" || Array.isArray(arg)) arg = {};
  }
  const dates = resolveDates(arg, new Date());
  const raw = await fetchAll();
  const notes = [];

  const rows = [];
  CITIES.forEach(([name], i) => {
    const daily = raw[i]?.daily;
    if (!daily || !Array.isArray(daily.time)) return;
    let idx = dates.map((d) => daily.time.indexOf(d)).filter((n) => n >= 0);
    if (idx.length === 0) { idx = daily.time.map((_, n) => n); notes.push("дати поза прогнозом"); }
    const mean = (arr) => {
      const v = idx.map((n) => arr?.[n]).filter((x) => typeof x === "number" && Number.isFinite(x));
      return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
    };
    const feels = mean(daily.apparent_temperature_max) ?? mean(daily.temperature_2m_max);
    const precip = mean(daily.precipitation_probability_max);
    const wind = mean(daily.wind_speed_10m_max);
    const cloud = mean(daily.cloud_cover_mean);
    rows.push({ name, feels, precip, wind, cloud, comfort: comfort(feels, precip, wind, cloud) });
  });

  rows.sort((a, b) => b.comfort - a.comfort);

  const out = [];
  out.push(`Дати: ${dates.join(", ")}`);
  if (notes.length) out.push(`Примітка: ${[...new Set(notes)].join("; ")}`);
  out.push("Погода по містах (відсортовано за комфортом). Проранжуй під критерій користувача:");
  for (const r of rows) {
    out.push(
      `- ${r.name}: тепловідчуття ${r.feels}°, опади ${r.precip}%, вітер ${r.wind} км/год, хмарність ${r.cloud}%, комфорт ${r.comfort}/100`,
    );
  }
  console.log(out.join("\n"));
}

main().catch((err) => {
  console.error("holiday-weather failed:", err?.message ?? err);
  process.exit(1);
});
