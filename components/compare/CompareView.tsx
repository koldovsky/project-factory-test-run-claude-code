"use client";

import { useCallback, useState } from "react";

import { CompareTable } from "@/components/compare/CompareTable";
import { PinBar } from "@/components/compare/PinBar";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { addPin, isPinned, removePin } from "@/lib/compare/pins";
import type { ActiveLocation } from "@/lib/location/types";

// Weekend-compare container above the forecast (FR-COMPARE-01/02/03).
//
// Client component (design decision 1): holds the pin set and the "Compare
// weekend" toggle in in-memory React state — no cookies, no server persistence
// (BC-PRIVACY-03); persistence across reload is intentionally not required. The
// pure reducer (`lib/compare/pins.ts`) enforces the 3-city limit and dedupe; the
// `atLimit` flag drives PinBar's calm inline message. The toggle is a
// keyboard-operable control with an accessible name and the shared focus ring.
// When comparing, the CompareTable renders one column per pinned city (or the
// calm empty state when none are pinned), never a blank table. All copy comes
// from `lib/i18n`.

export interface CompareViewProps {
  /** The current active city (from the URL); the pin target. */
  active: ActiveLocation;
}

export function CompareView({ active }: CompareViewProps) {
  const [pins, setPins] = useState<ActiveLocation[]>([]);
  const [comparing, setComparing] = useState(false);
  const [atLimit, setAtLimit] = useState(false);

  // Reset the limit notice when the active city changes (soft navigation keeps
  // this component mounted, so its state survives) — the notice belongs to a
  // specific rejected pin attempt and must not carry over to a newly-selected,
  // not-yet-attempted city (global review finding). React's documented
  // "adjust state when a prop changes" pattern: compare against the previous
  // value during render rather than in an effect (avoids cascading-render lint).
  const activeKey = `${active.lat},${active.lon}`;
  const [prevActiveKey, setPrevActiveKey] = useState(activeKey);
  if (activeKey !== prevActiveKey) {
    setPrevActiveKey(activeKey);
    setAtLimit(false);
  }

  const handlePinActive = useCallback(() => {
    setPins((current) => {
      const result = addPin(current, active);
      setAtLimit(result.atLimit);
      return result.pins;
    });
  }, [active]);

  const handleUnpin = useCallback((city: ActiveLocation) => {
    setPins((current) => removePin(current, city).pins);
    // Unpinning frees a slot, so clear any stale limit message.
    setAtLimit(false);
  }, []);

  const toggleComparing = useCallback(() => {
    setComparing((on) => !on);
  }, []);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PinBar
          pins={pins}
          active={active}
          activePinned={isPinned(pins, active)}
          atLimit={atLimit}
          onPinActive={handlePinActive}
          onUnpin={handleUnpin}
        />
        <Button
          type="button"
          variant={comparing ? "default" : "outline"}
          size="sm"
          aria-pressed={comparing}
          onClick={toggleComparing}
        >
          {t("compareToggleLabel")}
        </Button>
      </div>

      {comparing ? <CompareTable pins={pins} /> : null}
    </section>
  );
}
