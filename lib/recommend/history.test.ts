// Bounded history log (docs/day-03-skills-demo.md §7).

import { describe, it, expect } from "vitest";

import { appendHistory, HISTORY_CAP, type HistoryEntry } from "./history";

function entry(id: string): HistoryEntry {
  return {
    id,
    generatedAt: id,
    query: { dates: [], criterion: "x" },
    ranked: [],
    winner: null,
    notes: [],
  };
}

describe("appendHistory", () => {
  it("prepends newest first", () => {
    const out = appendHistory([entry("a")], entry("b"));
    expect(out.map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("caps the length, keeping the most recent", () => {
    let list: HistoryEntry[] = [];
    for (let i = 0; i < HISTORY_CAP + 5; i += 1) list = appendHistory(list, entry(`e${i}`));
    expect(list).toHaveLength(HISTORY_CAP);
    expect(list[0].id).toBe(`e${HISTORY_CAP + 4}`); // newest
    expect(list.at(-1)?.id).toBe(`e5`); // oldest kept
  });

  it("tolerates a missing / non-array existing log", () => {
    expect(appendHistory(null, entry("a"))).toHaveLength(1);
    expect(appendHistory("garbage", entry("a"))).toHaveLength(1);
    expect(appendHistory(undefined, entry("a"))[0].id).toBe("a");
  });
});
