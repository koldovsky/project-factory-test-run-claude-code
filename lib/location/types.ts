// Active-location domain model (TC-PURE-01: framework-free).
//
// The active location lives in the URL (`?lat&lon&name`) — no cookies, no
// server state (BC-PRIVACY-03). This is the shared contract every later slice
// (search, forecast, map, jokes) depends on, so it is locked here with
// exhaustive unit tests.

/** A geographic place the user is exploring. */
export interface ActiveLocation {
  lat: number;
  lon: number;
  name: string;
}

/**
 * Discriminated result of parsing deep-link query parameters into an
 * {@link ActiveLocation}. On failure, `reason` is a short, internal diagnostic
 * (the user-facing copy comes from `lib/i18n`, never from here).
 */
export type ParseLocationResult =
  | { ok: true; location: ActiveLocation }
  | { ok: false; reason: string };
