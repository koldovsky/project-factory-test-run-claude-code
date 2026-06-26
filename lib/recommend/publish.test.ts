// Validation of the agent's published ranking (docs/day-03-skills-demo.md).

import { describe, it, expect } from "vitest";

import { buildRecommendation } from "./publish";

describe("buildRecommendation", () => {
  it("resolves names (uk + en), keeps order, derives band + deep link", () => {
    const rec = buildRecommendation({
      dates: ["2026-06-27"],
      criterion: "прохолода",
      ranked: [
        { name: "Ужгород", score: 92, note: "найпрохолодніше" },
        { name: "Lviv", score: 80, note: "свіжо" },
      ],
    });
    expect(rec.winner?.nameEn).toBe("Uzhhorod");
    expect(rec.ranked.map((c) => c.nameEn)).toEqual(["Uzhhorod", "Lviv"]);
    expect(rec.ranked[0].band).toBe("green");
    expect(rec.ranked[0].note).toBe("найпрохолодніше");
    expect(rec.ranked[0].deepLink).toMatch(/^\/\?lat=.+&lon=.+&name=/);
    expect(rec.query.criterion).toBe("прохолода");
  });

  it("sorts ranked by score descending (winner = top score), even if input is unordered", () => {
    const rec = buildRecommendation({
      dates: ["2026-06-27"],
      criterion: "прохолода",
      ranked: [
        { name: "Харків", score: 85, note: "" },
        { name: "Полтава", score: 88, note: "" },
        { name: "Суми", score: 86, note: "" },
      ],
    });
    expect(rec.ranked.map((c) => c.score)).toEqual([88, 86, 85]);
    expect(rec.winner?.nameEn).toBe("Poltava");
  });

  it("skips unknown cities with a note (never fabricates)", () => {
    const rec = buildRecommendation({
      dates: [],
      criterion: "тепло",
      ranked: [
        { name: "Атлантида", score: 50 },
        { name: "Одеса", score: 88 },
      ],
    });
    expect(rec.ranked.map((c) => c.nameEn)).toEqual(["Odesa"]);
    expect(rec.notes.some((n) => n.includes("Невідоме місто"))).toBe(true);
  });

  it("clamps scores, de-dupes repeats, defaults the criterion", () => {
    const rec = buildRecommendation({
      dates: [],
      criterion: "",
      ranked: [
        { name: "Київ", score: 150, note: "" },
        { name: "kyiv", score: 10, note: "" },
      ],
    });
    expect(rec.ranked).toHaveLength(1);
    expect(rec.ranked[0].score).toBe(100);
    expect(rec.query.criterion).toBe("комфорт");
  });

  it("passes the question + summary through, trimming empties to undefined", () => {
    const withText = buildRecommendation({
      dates: ["2026-06-27"],
      criterion: "тепло",
      question: "  де найтепліше?  ",
      summary: "Найтепліше на півдні.",
      ranked: [{ name: "Одеса", score: 90 }],
    });
    expect(withText.question).toBe("де найтепліше?");
    expect(withText.summary).toBe("Найтепліше на півдні.");

    const blank = buildRecommendation({
      dates: [],
      criterion: "x",
      question: "   ",
      ranked: [{ name: "Київ", score: 50 }],
    });
    expect(blank.question).toBeUndefined();
    expect(blank.summary).toBeUndefined();
  });

  it("filters non-string notes and clamps long text (renderer-safe)", () => {
    const rec = buildRecommendation({
      dates: ["2026-06-27"],
      criterion: "x".repeat(500),
      summary: "s".repeat(500),
      notes: ["ok", 123, null, {}, "fine"],
      ranked: [{ name: "Київ", score: 80, note: "n".repeat(500) }],
    } as unknown as Parameters<typeof buildRecommendation>[0]);
    expect(rec.notes).toEqual(["ok", "fine"]);
    expect(rec.query.criterion.length).toBeLessThanOrEqual(280);
    expect((rec.summary ?? "").length).toBeLessThanOrEqual(280);
    expect(rec.ranked[0].note.length).toBeLessThanOrEqual(280);
  });

  it("is total for junk input", () => {
    // @ts-expect-error — deliberately malformed
    const rec = buildRecommendation({});
    expect(rec.winner).toBeNull();
    expect(rec.ranked).toHaveLength(0);
  });
});
