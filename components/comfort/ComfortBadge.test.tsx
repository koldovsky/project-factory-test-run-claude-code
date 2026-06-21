// @trace FR-COMFORT-04
//
// Render test for the comfort badge (review-gate gap): the band logic is tested
// in lib/scoring/band.test.ts, but the badge's own value display, band->style
// wiring, and color-not-alone accessible name were untested. Uses
// react-dom/server (no DOM needed), so it runs in the default Node environment.
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ComfortBadge } from "./ComfortBadge";
import { uk } from "@/lib/i18n";

describe("ComfortBadge (FR-COMFORT-04)", () => {
  it("renders the integer value", () => {
    const html = renderToStaticMarkup(<ComfortBadge value={82} />);
    expect(html).toContain("82");
  });

  it("maps the value to the correct band via data-band (half-open 70/40)", () => {
    expect(renderToStaticMarkup(<ComfortBadge value={70} />)).toContain('data-band="green"');
    expect(renderToStaticMarkup(<ComfortBadge value={69} />)).toContain('data-band="yellow"');
    expect(renderToStaticMarkup(<ComfortBadge value={40} />)).toContain('data-band="yellow"');
    expect(renderToStaticMarkup(<ComfortBadge value={39} />)).toContain('data-band="red"');
  });

  it("exposes an accessible name carrying the value AND the Ukrainian band word (not color-only)", () => {
    const html = renderToStaticMarkup(<ComfortBadge value={82} />);
    // aria-label must contain the numeric value and the Ukrainian band label,
    // so the band is conveyed in words, never by color alone (NFR-A11Y).
    expect(html).toMatch(/aria-label="[^"]*82[^"]*"/);
    expect(html).toContain(uk.comfortBandGreenLabel);
    expect(html).toContain(uk.comfortBadgeLabel);
  });

  it("uses the red band word for a low value's accessible name", () => {
    const html = renderToStaticMarkup(<ComfortBadge value={20} />);
    expect(html).toContain(uk.comfortBandRedLabel);
    expect(html).toMatch(/aria-label="[^"]*20[^"]*"/);
  });
});
