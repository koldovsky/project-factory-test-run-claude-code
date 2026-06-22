// @trace FR-FORECAST-01, FR-COMPARE-02, TC-DATA-01
//
// Phase 5 cross-cutting integration: the /api/forecast route handler driven by a
// REAL `new Request(...)` against a STUBBED `globalThis.fetch` returning a
// recorded Open-Meteo forecast body (ADR-0001: keyless/DB-free — recorded
// responses are the deterministic fixtures). Proves the route + `fetchForecast`
// + `mapForecast` compose: a raw upstream body becomes the mapped `Forecast`
// JSON, invalid coordinates never reach the network (400), upstream failure is a
// calm 502, nothing throws, and the outgoing URL carries no key (TC-DATA-01).
// Runs over already-implemented code, so it passes green.

import { afterEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/forecast/route";
import {
  FORECAST_HOST,
  forecastFixture,
  stubFetch,
  type FetchStub,
} from "./fixtures";

let stub: FetchStub | null = null;

afterEach(() => {
  stub?.restore();
  stub = null;
});

interface ForecastBody {
  forecast: {
    days: Array<Record<string, unknown>>;
    hourly: { time: string[]; tempC: number[] };
    sunrise: string;
    sunset: string;
    timezone: string;
  } | null;
  error?: string;
}

function forecastRequest(query: string): Request {
  return new Request(`http://localhost/api/forecast${query}`);
}

describe("/api/forecast — maps a valid upstream body to forecast JSON (FR-FORECAST-01, FR-COMPARE-02)", () => {
  it("returns the mapped forecast for valid coordinates", async () => {
    stub = stubFetch({ [FORECAST_HOST]: { ok: true, body: forecastFixture } });

    const res = await GET(forecastRequest("?lat=50.45&lon=30.52"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as ForecastBody;
    expect(body.forecast).not.toBeNull();
    const forecast = body.forecast!;

    // 7 well-formed daily entries map through.
    expect(forecast.days).toHaveLength(7);
    expect(forecast.days[0]).toMatchObject({
      date: "2026-06-19",
      hiC: 22.4,
      loC: 12.1,
      weatherCode: 1,
    });

    // 48h hourly series preserved as parallel arrays.
    expect(forecast.hourly.time).toHaveLength(48);
    expect(forecast.hourly.tempC).toHaveLength(48);

    // Day-0 location-local sun times + timezone surfaced.
    expect(forecast.sunrise).toBe("2026-06-19T04:46");
    expect(forecast.sunset).toBe("2026-06-19T21:11");
    expect(forecast.timezone).toBe("Europe/Kyiv");
  });

  it("tolerates trailing zeros in the coordinate query (FR-COMPARE-02)", async () => {
    stub = stubFetch({ [FORECAST_HOST]: { ok: true, body: forecastFixture } });

    const res = await GET(forecastRequest("?lat=50.450&lon=30.520"));
    const body = (await res.json()) as ForecastBody;

    expect(res.status).toBe(200);
    expect(body.forecast).not.toBeNull();
  });
});

describe("/api/forecast — invalid coordinates never reach the network (400)", () => {
  const cases: Array<{ name: string; query: string }> = [
    { name: "missing both", query: "" },
    { name: "missing lon", query: "?lat=50.45" },
    { name: "missing lat", query: "?lon=30.52" },
    { name: "non-numeric lat", query: "?lat=abc&lon=30.52" },
    { name: "NaN literal lat", query: "?lat=NaN&lon=30.52" },
    { name: "Infinity literal lon", query: "?lat=50.45&lon=Infinity" },
    { name: "lat above range", query: "?lat=91&lon=30.52" },
    { name: "lat below range", query: "?lat=-91&lon=30.52" },
    { name: "lon above range", query: "?lat=50.45&lon=181" },
    { name: "lon below range", query: "?lat=50.45&lon=-181" },
    { name: "blank lat", query: "?lat=&lon=30.52" },
  ];

  for (const { name, query } of cases) {
    it(`responds 400 with forecast:null and no upstream call — ${name}`, async () => {
      stub = stubFetch({ [FORECAST_HOST]: { ok: true, body: forecastFixture } });

      const res = await GET(forecastRequest(query));
      expect(res.status).toBe(400);

      const body = (await res.json()) as ForecastBody;
      expect(body.forecast).toBeNull();
      expect(typeof body.error).toBe("string");

      // Out-of-range / invalid input must NOT issue a network request.
      expect(stub.fn).not.toHaveBeenCalled();
    });
  }

  it("accepts the boundary coordinates (lat 90 / lon 180)", async () => {
    stub = stubFetch({ [FORECAST_HOST]: { ok: true, body: forecastFixture } });

    const res = await GET(forecastRequest("?lat=90&lon=180"));
    expect(res.status).toBe(200);
    expect(stub.fn).toHaveBeenCalledTimes(1);
  });
});

describe("/api/forecast — upstream / network failure degrades to 502, never throws (NFR-OBS-01)", () => {
  it("returns a calm 502 forecast:null when upstream is non-2xx (ok:false)", async () => {
    stub = stubFetch({
      [FORECAST_HOST]: { ok: false, status: 500, body: { reason: "boom" } },
    });

    const res = await GET(forecastRequest("?lat=50.45&lon=30.52"));
    expect(res.status).toBe(502);

    const body = (await res.json()) as ForecastBody;
    expect(body.forecast).toBeNull();
    expect(typeof body.error).toBe("string");
  });

  it("returns a calm 502 when fetch rejects (network error), never rejecting", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    try {
      const res = await GET(forecastRequest("?lat=50.45&lon=30.52"));
      expect(res.status).toBe(502);
      const body = (await res.json()) as ForecastBody;
      expect(body.forecast).toBeNull();
    } finally {
      globalThis.fetch = original;
    }
  });

  it("returns a calm 502 when the upstream body is malformed (not mappable)", async () => {
    stub = stubFetch({
      [FORECAST_HOST]: { ok: true, body: { nonsense: true } },
    });

    const res = await GET(forecastRequest("?lat=50.45&lon=30.52"));
    expect(res.status).toBe(502);

    const body = (await res.json()) as ForecastBody;
    expect(body.forecast).toBeNull();
  });
});

describe("/api/forecast — outgoing URL carries no key/secret (TC-DATA-01)", () => {
  it("requests the keyless Open-Meteo forecast endpoint with timezone=auto and no api key", async () => {
    stub = stubFetch({ [FORECAST_HOST]: { ok: true, body: forecastFixture } });

    await GET(forecastRequest("?lat=50.45&lon=30.52"));

    expect(stub.fn).toHaveBeenCalledTimes(1);
    const arg = stub.fn.mock.calls[0][0];
    const url =
      typeof arg === "string"
        ? arg
        : arg instanceof URL
          ? arg.toString()
          : (arg as Request).url;

    expect(url).toContain(FORECAST_HOST);
    expect(url).toContain("latitude=50.45");
    expect(url).toContain("longitude=30.52");
    expect(url).toContain("timezone=auto");

    const lower = url.toLowerCase();
    for (const forbidden of [
      "apikey",
      "api_key",
      "appid",
      "app_id",
      "secret",
      "token",
      "access_key",
      "key=",
    ]) {
      expect(lower).not.toContain(forbidden);
    }
  });
});
