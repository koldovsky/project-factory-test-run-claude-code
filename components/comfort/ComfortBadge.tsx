import { cn } from "@/lib/utils";
import { comfortBand, type ComfortBand } from "@/lib/scoring/band";
import { t } from "@/lib/i18n";

// Per-day comfort badge (FR-COMFORT-04, NFR-A11Y).
//
// Server component: pure presentation, no interactivity or browser APIs. The
// band is DERIVED from the integer value via the shared `comfortBand` helper so
// the badge and the scoring logic can never drift. The accessible name conveys
// the comfort value AND the band in Ukrainian words — it never relies on color
// alone to communicate the band (NFR-A11Y).

// Static band → style + i18n-key map, hoisted out of the component so it is not
// rebuilt per render (rendering-hoist-jsx). Colors carry AA contrast in both
// themes and the badge always pairs color with a text label.
const BAND_STYLES: Record<ComfortBand, string> = {
  green: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  yellow: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  red: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

const BAND_LABEL_KEY = {
  green: "comfortBandGreenLabel",
  yellow: "comfortBandYellowLabel",
  red: "comfortBandRedLabel",
} as const;

export interface ComfortBadgeProps {
  /** Integer comfort value 0..100; the band is derived from it. */
  value: number;
  className?: string;
}

export function ComfortBadge({ value, className }: ComfortBadgeProps) {
  const band = comfortBand(value);
  const bandLabel = t(BAND_LABEL_KEY[band]);
  // e.g. "Комфорт 82 — сприятливо": value + band conveyed without relying on color.
  const accessibleName = `${t("comfortBadgeLabel")} ${value} — ${bandLabel}`;

  return (
    <span
      role="img"
      aria-label={accessibleName}
      data-band={band}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium",
        BAND_STYLES[band],
        className,
      )}
    >
      <span aria-hidden="true">{value}</span>
      <span aria-hidden="true" className="text-xs font-normal opacity-80">
        {bandLabel}
      </span>
    </span>
  );
}
