// Pure date resolution (docs/day-03-skills-demo.md).

import { describe, it, expect } from "vitest";

import { datesFromWhen, resolveDates } from "./dates";

// 2026-06-26 is a Friday (local noon avoids any TZ edge).
const FRI = new Date("2026-06-26T12:00:00");

describe("datesFromWhen", () => {
  it("resolves today / tomorrow / next-3-days", () => {
    expect(datesFromWhen("today", FRI)).toEqual(["2026-06-26"]);
    expect(datesFromWhen("tomorrow", FRI)).toEqual(["2026-06-27"]);
    expect(datesFromWhen("next-3-days", FRI)).toEqual(["2026-06-26", "2026-06-27", "2026-06-28"]);
  });

  it("this-weekend → upcoming Saturday + Sunday", () => {
    expect(datesFromWhen("this-weekend", FRI)).toEqual(["2026-06-27", "2026-06-28"]);
  });
});

describe("resolveDates", () => {
  it("honours valid explicit dates (dropping junk)", () => {
    expect(resolveDates({ dates: ["2026-07-01", "bad", "2026-07-02"] }, FRI)).toEqual([
      "2026-07-01",
      "2026-07-02",
    ]);
  });

  it("falls back to `when` when dates has no usable strings", () => {
    expect(resolveDates({ dates: [123, null], when: "tomorrow" }, FRI)).toEqual(["2026-06-27"]);
  });

  it("defaults to this-weekend", () => {
    expect(resolveDates({}, FRI)).toEqual(["2026-06-27", "2026-06-28"]);
  });

  it("dedupes and caps an oversized explicit date list", () => {
    const many = Array.from({ length: 20 }, (_, i) => `2026-07-${String(i + 1).padStart(2, "0")}`);
    const out = resolveDates({ dates: [...many, "2026-07-01"] }, FRI);
    expect(out).toHaveLength(14); // capped
    expect(new Set(out).size).toBe(out.length); // deduped
  });
});
