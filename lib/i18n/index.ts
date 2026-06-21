// Centralized i18n accessor (NFR-I18N-01). `uk` is the source of truth; `en`
// mirrors its keys. `t(key)` is a typed accessor over a `const` object, so a
// missing or misspelled key is a compile error — no runtime "undefined" can
// leak into the UI.
//
// Pure (TC-PURE-01): no react/next/DOM imports.

import { uk } from "./uk";
import { en } from "./en";

export { uk, en };

/** Compile-time-safe set of every defined message key. */
export type MessageKey = keyof typeof uk;

/** Return the Ukrainian string for `key` (the active language in the MVP). */
export function t(key: MessageKey): string {
  return uk[key];
}
