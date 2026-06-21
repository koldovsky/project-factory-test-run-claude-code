"use client";

import { useSyncExternalStore } from "react";

import { formatClock } from "@/lib/clock/format";
import { t } from "@/lib/i18n";

// Live visitor local-time clock (FR-CLOCK-01).
//
// Client component: it reads the visitor's own locale/timezone (browser-only)
// and ticks every second. The pure time formatting lives in
// `lib/clock/format.ts` (TC-PURE-01); this component only owns the timer,
// hydration safety, and accessibility.
//
// `useSyncExternalStore` is the right primitive for "external system that
// changes over time" with SSR support: it subscribes to the 1s timer and
// exposes a distinct server snapshot, so there is no synchronous setState in an
// effect (no cascading renders) and no hydration mismatch.
//
// Hydration safety (design decision 3): the server snapshot is a stable
// placeholder; React renders that on the server and on the first client paint,
// then swaps to the live client snapshot. `suppressHydrationWarning` covers the
// expected text difference on that first paint
// (rendering-hydration-suppress-warning).
//
// No layout shift (design decision 4): `tabular-nums` gives fixed-width digits
// and the HH:MM format is stable, so the rendered width never changes as the
// minute rolls over. The placeholder has the same width as a real time.

const PLACEHOLDER = "--:--";
const TICK_MS = 1000;

/** Subscribe to a 1s timer; the cleanup clears it (silent teardown, NFR-OBS-01). */
function subscribe(onChange: () => void): () => void {
  const id = setInterval(onChange, TICK_MS);
  return () => {
    clearInterval(id);
  };
}

/** Live snapshot: the visitor's local time from the browser's own settings. */
function getClientSnapshot(): string {
  return formatClock(new Date());
}

/** Server snapshot: a stable placeholder so SSR markup is deterministic. */
function getServerSnapshot(): string {
  return PLACEHOLDER;
}

export function Clock() {
  const time = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  return (
    <time
      aria-label={t("clockRegionLabel")}
      className="tabular-nums"
      suppressHydrationWarning
    >
      {time}
    </time>
  );
}
