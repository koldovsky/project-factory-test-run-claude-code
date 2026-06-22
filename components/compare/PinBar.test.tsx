// @trace FR-COMPARE-01, NFR-A11Y-01
//
// Regression guards for the review-fixed PinBar behaviors (global review +
// weekend-compare review): the WCAG 2.5.3 label-in-name on the pin button and the
// stale limit-notice gating. PinBar is a pure presentational client component
// (props in, no hooks), so react-dom/server renders it for assertion in Node.
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PinBar } from "./PinBar";
import { uk } from "@/lib/i18n";
import type { ActiveLocation } from "@/lib/location/types";

const KYIV: ActiveLocation = { lat: 50.45, lon: 30.52, name: "Київ" };
const LVIV: ActiveLocation = { lat: 49.84, lon: 24.03, name: "Львів" };
const ODESA: ActiveLocation = { lat: 46.48, lon: 30.72, name: "Одеса" };
const noop = () => {};

function render(props: Partial<React.ComponentProps<typeof PinBar>> = {}) {
  return renderToStaticMarkup(
    <PinBar
      pins={props.pins ?? []}
      active={props.active ?? KYIV}
      activePinned={props.activePinned ?? false}
      atLimit={props.atLimit ?? false}
      onPinActive={noop}
      onUnpin={noop}
    />,
  );
}

describe("PinBar — WCAG 2.5.3 label-in-name on the pin button", () => {
  it("the pin button's accessible name contains its visible label", () => {
    const html = render({ active: KYIV, activePinned: false });
    // Visible label = comparePinCurrent; aria-label must contain it (+ the city).
    expect(html).toContain(uk.comparePinCurrent);
    expect(html).toMatch(
      new RegExp(`aria-label="[^"]*${uk.comparePinCurrent}[^"]*Київ`),
    );
  });
});

describe("PinBar — limit notice is gated, never stale", () => {
  it("shows the limit notice when at the limit and the active city is pinnable", () => {
    const html = render({
      pins: [LVIV, ODESA, { lat: 1, lon: 1, name: "C3" }],
      active: KYIV,
      activePinned: false,
      atLimit: true,
    });
    expect(html).toContain(uk.compareLimitNotice);
  });

  it("hides the limit notice when the active city is already pinned (not stale)", () => {
    const html = render({
      pins: [KYIV, LVIV, ODESA],
      active: KYIV,
      activePinned: true, // canPinActive=false → notice must not show
      atLimit: true,
    });
    expect(html).not.toContain(uk.compareLimitNotice);
  });
});

describe("PinBar — chip remove control has an accessible name with the city", () => {
  it("each chip's remove button names the action and the city", () => {
    const html = render({ pins: [KYIV], active: LVIV });
    expect(html).toMatch(
      new RegExp(`aria-label="${uk.compareUnpinAction} Київ"`),
    );
  });
});
