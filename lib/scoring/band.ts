// Half-open comfort-band classification (FR-COMFORT-04).
//
// Pure & framework-free (TC-PURE-01): no next/*, react, or DOM imports. Maps an
// integer comfort value to exactly one of three bands using half-open ranges so
// every value lands in precisely one band:
//   green  when value >= 70
//   yellow when 40 <= value < 70
//   red    when value < 40
// Thresholds (70 / 40) are fixed for the MVP and not user-tunable.

export type ComfortBand = "green" | "yellow" | "red";

/** Classify a comfort value into its half-open color band. */
export function comfortBand(value: number): ComfortBand {
  if (value >= 70) return "green";
  if (value >= 40) return "yellow";
  return "red";
}
