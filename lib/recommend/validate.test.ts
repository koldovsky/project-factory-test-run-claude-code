// Recommendation shape guard (docs/day-03-skills-demo.md).

import { describe, it, expect } from "vitest";

import { isRecommendation } from "./validate";

const valid = {
  query: { dates: ["2026-06-27"], criterion: "тепло" },
  ranked: [{ nameUk: "Одеса", score: 90, band: "green", note: "", deepLink: "/", nameEn: "Odesa", lat: 1, lon: 2 }],
  winner: null,
  notes: [],
  generatedAt: "2026-06-27T00:00:00Z",
  id: "abc",
};

describe("isRecommendation", () => {
  it("accepts a well-formed payload (with extra fields)", () => {
    expect(isRecommendation(valid)).toBe(true);
    expect(isRecommendation({ ...valid, winner: valid.ranked[0] })).toBe(true);
  });

  it("rejects malformed payloads that would crash the renderer", () => {
    expect(isRecommendation(null)).toBe(false);
    expect(isRecommendation("oops")).toBe(false);
    expect(isRecommendation({ ...valid, query: undefined })).toBe(false);
    expect(isRecommendation({ ...valid, query: { dates: "no", criterion: "x" } })).toBe(false);
    expect(isRecommendation({ ...valid, query: { dates: [], criterion: 5 } })).toBe(false);
    expect(isRecommendation({ ...valid, ranked: "no" })).toBe(false);
    expect(isRecommendation({ ...valid, ranked: [null] })).toBe(false);
    expect(isRecommendation({ ...valid, notes: undefined })).toBe(false);
    expect(isRecommendation({ ...valid, notes: ["ok", 123] })).toBe(false);
    expect(isRecommendation({ ...valid, winner: 42 })).toBe(false);
  });
});
