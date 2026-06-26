// Integrity of the curated candidate pool (docs/day-03-skills-demo.md §6).

import { describe, it, expect } from "vitest";

import { CITIES } from "./cities";

describe("CITIES", () => {
  it("excludes Crimea / Donetsk / Luhansk centres", () => {
    const names = CITIES.map((c) => c.nameEn.toLowerCase());
    for (const excluded of ["donetsk", "luhansk", "simferopol", "sevastopol"]) {
      expect(names).not.toContain(excluded);
    }
  });

  it("lists the main cities with plausible Ukrainian coordinates", () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(20);
    for (const c of CITIES) {
      expect(c.nameUk.length).toBeGreaterThan(0);
      expect(c.nameEn.length).toBeGreaterThan(0);
      // Ukraine bounding box (generous).
      expect(c.lat).toBeGreaterThan(43);
      expect(c.lat).toBeLessThan(53.5);
      expect(c.lon).toBeGreaterThan(21);
      expect(c.lon).toBeLessThan(41);
      expect(c.affinities).toContain("city");
    }
  });

  it("has unique names", () => {
    const en = CITIES.map((c) => c.nameEn);
    expect(new Set(en).size).toBe(en.length);
  });

  it("tags coastal and Carpathian cities", () => {
    const byEn = (n: string) => CITIES.find((c) => c.nameEn === n)!;
    expect(byEn("Odesa").affinities).toContain("sea");
    expect(byEn("Kherson").affinities).toContain("sea");
    expect(byEn("Mykolaiv").affinities).toContain("sea");
    expect(byEn("Ivano-Frankivsk").affinities).toContain("mountains");
    expect(byEn("Uzhhorod").affinities).toContain("mountains");
    // A plainly inland city is neither.
    expect(byEn("Kharkiv").affinities).toEqual(["city"]);
  });
});
