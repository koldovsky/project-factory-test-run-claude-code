// @trace FR-SEARCH-01, FR-SEARCH-05, TC-DATA-01
//
// Phase 5 cross-cutting integration: the /api/geocode route handler driven by a
// REAL `new Request(...)` against a STUBBED `globalThis.fetch` returning recorded
// Open-Meteo bodies (ADR-0001: keyless/DB-free — recorded responses are the
// deterministic fixtures). This proves the route + `lib/geo` parser/mapper
// compose: an upstream geocoding body becomes mapped `suggestions`, and every
// non-happy path degrades calmly (FR-SEARCH-05) with no key in the outgoing URL
// (TC-DATA-01). These run over already-implemented code, so they pass green.

import { afterEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/geocode/route";
import {
  GEOCODE_HOST,
  geocodeEmptyFixture,
  geocodeFixture,
  stubFetch,
  type FetchStub,
} from "./fixtures";

let stub: FetchStub | null = null;

afterEach(() => {
  stub?.restore();
  stub = null;
});

function geocodeRequest(q: string): Request {
  return new Request(
    `http://localhost/api/geocode?q=${encodeURIComponent(q)}`,
  );
}

describe("/api/geocode — maps upstream results to suggestions (FR-SEARCH-01)", () => {
  it("returns mapped suggestions with name/admin1/country/countryCode/lat/lon", async () => {
    stub = stubFetch({ [GEOCODE_HOST]: { ok: true, body: geocodeFixture } });

    const res = await GET(geocodeRequest("Kyiv"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      suggestions: Array<Record<string, unknown>>;
    };
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body.suggestions).toHaveLength(2);

    const [kyiv, lviv] = body.suggestions;
    expect(kyiv).toMatchObject({
      name: "Київ",
      admin1: "Київ",
      country: "Україна",
      countryCode: "UA",
      lat: 50.45466,
      lon: 30.5238,
    });
    expect(lviv).toMatchObject({
      name: "Львів",
      admin1: "Львівська область",
      country: "Україна",
      countryCode: "UA",
      lat: 49.83826,
      lon: 24.02324,
    });
  });

  it("preserves Open-Meteo result order", async () => {
    stub = stubFetch({ [GEOCODE_HOST]: { ok: true, body: geocodeFixture } });

    const res = await GET(geocodeRequest("Kyiv"));
    const body = (await res.json()) as { suggestions: Array<{ name: string }> };

    expect(body.suggestions.map((s) => s.name)).toEqual(["Київ", "Львів"]);
  });
});

describe("/api/geocode — empty / whitespace query short-circuits (FR-SEARCH-05)", () => {
  it("does NOT call upstream and returns {suggestions:[]} for empty q", async () => {
    stub = stubFetch({ [GEOCODE_HOST]: { ok: true, body: geocodeFixture } });

    const res = await GET(geocodeRequest(""));
    const body = (await res.json()) as { suggestions: unknown[] };

    expect(res.status).toBe(200);
    expect(body.suggestions).toEqual([]);
    expect(stub.fn).not.toHaveBeenCalled();
  });

  it("does NOT call upstream for a whitespace-only q", async () => {
    stub = stubFetch({ [GEOCODE_HOST]: { ok: true, body: geocodeFixture } });

    const res = await GET(geocodeRequest("   "));
    const body = (await res.json()) as { suggestions: unknown[] };

    expect(body.suggestions).toEqual([]);
    expect(stub.fn).not.toHaveBeenCalled();
  });

  it("does NOT call upstream when q is missing entirely", async () => {
    stub = stubFetch({ [GEOCODE_HOST]: { ok: true, body: geocodeFixture } });

    const res = await GET(new Request("http://localhost/api/geocode"));
    const body = (await res.json()) as { suggestions: unknown[] };

    expect(body.suggestions).toEqual([]);
    expect(stub.fn).not.toHaveBeenCalled();
  });
});

describe("/api/geocode — zero results is calm, not an error (FR-SEARCH-05)", () => {
  it("maps the results-omitted body to {suggestions:[]}", async () => {
    stub = stubFetch({
      [GEOCODE_HOST]: { ok: true, body: geocodeEmptyFixture },
    });

    const res = await GET(geocodeRequest("Zzzxqq"));
    const body = (await res.json()) as { suggestions: unknown[] };

    expect(res.status).toBe(200);
    expect(body.suggestions).toEqual([]);
    expect(stub.fn).toHaveBeenCalledTimes(1);
  });
});

describe("/api/geocode — upstream failure degrades honestly, never throws (FR-SEARCH-05, NFR-OBS-01)", () => {
  it("returns a calm non-2xx body when upstream is non-2xx (ok:false)", async () => {
    stub = stubFetch({
      [GEOCODE_HOST]: { ok: false, status: 503, body: { error: "boom" } },
    });

    // Must resolve, never reject.
    const res = await GET(geocodeRequest("Kyiv"));
    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);

    const body = (await res.json()) as { suggestions: unknown[] };
    expect(body.suggestions).toEqual([]);
  });

  it("returns a calm non-2xx body when fetch rejects (network error)", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    try {
      const res = await GET(geocodeRequest("Kyiv"));
      expect(res.ok).toBe(false);
      expect(res.status).toBeGreaterThanOrEqual(400);
      const body = (await res.json()) as { suggestions: unknown[] };
      expect(body.suggestions).toEqual([]);
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe("/api/geocode — outgoing URL carries no key/secret (TC-DATA-01)", () => {
  it("requests the keyless Open-Meteo geocoding endpoint with no api key params", async () => {
    stub = stubFetch({ [GEOCODE_HOST]: { ok: true, body: geocodeFixture } });

    await GET(geocodeRequest("Kyiv"));

    expect(stub.fn).toHaveBeenCalledTimes(1);
    const arg = stub.fn.mock.calls[0][0];
    const url =
      typeof arg === "string"
        ? arg
        : arg instanceof URL
          ? arg.toString()
          : (arg as Request).url;

    expect(url).toContain(GEOCODE_HOST);
    // The query the user typed is forwarded; Ukrainian labels requested.
    expect(url).toContain("name=Kyiv");
    expect(url).toContain("language=uk");

    // No key/secret/token/appid parameter of any kind (Open-Meteo is keyless).
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
