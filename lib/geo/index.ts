// Public surface of the pure `lib/geo` mappers (TC-PURE-01). Re-exports the
// per-domain modules so app/route consumers import from one place; the unit
// tests import from the per-file modules (`./map`, `./flag`, `./parse`)
// directly. No next/react/DOM imports.

export { toSuggestion } from "./map";
export type { GeoSuggestion, RawGeocodeResult } from "./map";
export { flagEmoji } from "./flag";
export { parseGeocodeResponse } from "./parse";
