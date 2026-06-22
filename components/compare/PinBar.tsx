"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { ActiveLocation } from "@/lib/location/types";

// Chip row of pinned cities above the forecast (FR-COMPARE-01, NFR-A11Y-01,
// BC-BRAND-01).
//
// Client component: it renders interactive pin/unpin controls driven by the
// parent's pin state (the pure reducer lives in `lib/compare/pins.ts`). Each
// chip shows the city name and a keyboard-operable remove control with an
// accessible name that identifies the city and the action; the shared Button
// carries the visible focus-visible ring. The 3-limit rejection surfaces as a
// calm inline Ukrainian message (no toast, no exclamation marks). All copy comes
// from `lib/i18n`; this renders no inline strings.

export interface PinBarProps {
  pins: ActiveLocation[];
  /** The current active city, offered as the pin target (null when none). */
  active: ActiveLocation | null;
  /** True when the active city is already pinned (pin control is then omitted). */
  activePinned: boolean;
  /** True when the last pin attempt was rejected because the limit is reached. */
  atLimit: boolean;
  onPinActive: () => void;
  onUnpin: (city: ActiveLocation) => void;
}

export function PinBar({
  pins,
  active,
  activePinned,
  atLimit,
  onPinActive,
  onUnpin,
}: PinBarProps) {
  const canPinActive = active !== null && !activePinned;

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label={t("comparePinBarLabel")}
        className="flex flex-wrap items-center gap-2"
      >
        {pins.map((city) => (
          <span
            key={`${city.lat},${city.lon}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted py-1 pl-3 pr-1 text-sm text-foreground"
          >
            <span>{city.name}</span>
            {/* Comfortable touch target, not crowded against the name (BUG-006). */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-full"
              aria-label={`${t("compareUnpinAction")} ${city.name}`}
              onClick={() => onUnpin(city)}
            >
              <X aria-hidden="true" />
            </Button>
          </span>
        ))}

        {canPinActive ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            // WCAG 2.5.3 (label-in-name): the accessible name contains the visible
            // label, then adds the city for context.
            aria-label={`${t("comparePinCurrent")} — ${active.name}`}
            onClick={onPinActive}
          >
            {t("comparePinCurrent")}
          </Button>
        ) : null}
      </div>

      {/* Only show the limit notice while the (rejected) pin affordance is still
          relevant — i.e. an unpinned active city is on offer. Navigating to an
          already-pinned city hides both the pin control and this notice, so it is
          never left stale. */}
      {atLimit && canPinActive ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("compareLimitNotice")}
        </p>
      ) : null}
    </div>
  );
}
