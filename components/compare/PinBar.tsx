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
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-sm text-foreground"
          >
            <span>{city.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 rounded-full"
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
            aria-label={`${t("comparePinAction")} ${active.name}`}
            onClick={onPinActive}
          >
            {t("comparePinCurrent")}
          </Button>
        ) : null}
      </div>

      {atLimit ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("compareLimitNotice")}
        </p>
      ) : null}
    </div>
  );
}
