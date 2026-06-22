// Pure rounded-coordinate label (TC-PURE-01: no react/next/DOM imports).
//
// FR-MAP-03 / ADR-0004: a map click has no reverse geocoding, so it labels its
// own location by the clicked coordinates. This is the calm, deterministic
// display name stored as the active location's `name` query param.
//
// Latitude first, then longitude, joined with a comma + single space:
//
//   coordinateLabel(50.4501, 30.5234) === "50.45, 30.5234"
//
// Each coordinate is rounded to AT MOST 4 decimal places (round-to-nearest, not
// banker's) and trailing zeros are dropped, so a clean value stays short
// ("50.45", not "50.4500") and a whole number drops the point ("50"). Output is
// PLAIN decimal notation only — never exponential ("1e-7") — because the label
// is round-tripped through the deep-link serializer (`toLocationQuery` ->
// `parseLocationParams`), which rejects exponential strings. Sub-1e-4 magnitudes
// therefore collapse to "0". Total and pure: defined for every finite number,
// never throws.

const MAX_DECIMALS = 4;
const SCALE = 10 ** MAX_DECIMALS; // 1e4

/**
 * Format a single coordinate as a plain, trimmed decimal string rounded to at
 * most {@link MAX_DECIMALS} places, round-half-away-from-zero.
 *
 * We round on the scaled integer rather than relying on `toFixed` alone:
 * `(50.12345).toFixed(4)` is "50.1234" because 50.12345 is stored just below its
 * decimal value, but `50.12345 * 1e4` recovers 501234.5, which `Math.round`
 * takes up to 501235 — the round-to-nearest the spec asks for (banker's rounding
 * is explicitly not used). `toFixed` then renders the result in fixed (never
 * exponential) notation; we strip trailing zeros and a bare decimal point, and
 * normalize a signed zero ("-0" -> "0") so the label stays calm.
 */
function formatPart(value: number): string {
  // Total: a non-finite input would leak "NaN"/throw; coerce to 0 so the
  // function is defined for every input the type allows.
  const safe = Number.isFinite(value) ? value : 0;

  // Round half away from zero on the scaled magnitude, then unscale.
  const rounded =
    (Math.sign(safe) * Math.round(Math.abs(safe) * SCALE)) / SCALE;

  // Fixed notation guarantees no exponential output even for sub-1e-6 inputs
  // (which `rounded` has already collapsed to 0). Then drop trailing zeros and a
  // trailing decimal point.
  let s = rounded.toFixed(MAX_DECIMALS);
  if (s.includes(".")) {
    s = s.replace(/0+$/, "").replace(/\.$/, "");
  }

  // Normalize signed zero: a tiny negative rounded to zero is "-0"; collapse to
  // "0" (no signed zero in the calm label).
  if (s === "-0") return "0";
  return s;
}

/**
 * Format a pair of coordinates as the display name a map click stores
 * (FR-MAP-03, ADR-0004). Pure and total.
 */
export function coordinateLabel(lat: number, lon: number): string {
  return `${formatPart(lat)}, ${formatPart(lon)}`;
}
