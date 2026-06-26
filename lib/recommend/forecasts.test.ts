// Batch multi-coordinate forecast fetch (docs/day-03-skills-demo.md).

import { describe, it, expect, vi, afterEach } from "vitest";

import { buildBatchUrl, fetchForecasts } from "./forecasts";

const COORDS = [
  { lat: 50.45, lon: 30.52 },
  { lat: 46.48, lon: 30.72 },
];

/** A minimal Open-Meteo single-location body that `mapForecast` accepts. */
function rawLocation() {
  return {
    timezone: "Europe/Kyiv",
    hourly: { time: ["2026-06-27T00:00"], temperature_2m: [18] },
    daily: {
      time: ["2026-06-27"],
      temperature_2m_max: [25],
      temperature_2m_min: [15],
      apparent_temperature_max: [24],
      weather_code: [0],
      precipitation_probability_max: [10],
      wind_speed_10m_max: [8],
      cloud_cover_mean: [20],
      uv_index_max: [5],
      sunrise: ["2026-06-27T05:00"],
      sunset: ["2026-06-27T21:00"],
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("buildBatchUrl", () => {
  it("comma-joins every coordinate into one keyless request", () => {
    const url = new URL(buildBatchUrl(COORDS));
    expect(url.searchParams.get("latitude")).toBe("50.45,46.48");
    expect(url.searchParams.get("longitude")).toBe("30.52,30.72");
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(url.searchParams.get("daily")).toContain("temperature_2m_max");
    expect(url.toString()).not.toMatch(/key|apikey|token/i);
  });
});

describe("fetchForecasts", () => {
  it("returns [] for no coordinates without calling the network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchForecasts([])).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps an array response index-aligned to the input coordinates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([rawLocation(), rawLocation()]), { status: 200 })),
    );
    const out = await fetchForecasts(COORDS);
    expect(out).toHaveLength(2);
    expect(out.every((r) => r.ok)).toBe(true);
  });

  it("degrades every coordinate to a typed failure on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 429 })));
    const out = await fetchForecasts(COORDS);
    expect(out).toHaveLength(2);
    expect(out.every((r) => !r.ok)).toBe(true);
  });

  it("never throws on a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );
    const out = await fetchForecasts(COORDS);
    expect(out.every((r) => !r.ok)).toBe(true);
  });
});
