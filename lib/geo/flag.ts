// Pure, framework-free flag-emoji helper (TC-PURE-01, FR-SEARCH-02, NFR-A11Y-01).
//
// Maps a 2-letter ISO 3166-1 alpha-2 code to the two Unicode regional-indicator
// symbols that render as that country's flag (e.g. "UA" -> the Ukrainian flag).
// Case-insensitive. The flag is purely DECORATIVE: an absent, malformed, or
// otherwise invalid code yields "" so the country name always carries the
// meaning as text and never as a placeholder box (NFR-A11Y-01). Total over all
// strings — never throws. No next/react/DOM imports.

/** Exactly two ASCII letters, nothing else (no whitespace, digits, symbols). */
const ALPHA2 = /^[A-Za-z]{2}$/;

/**
 * Offset from an uppercase ASCII letter (U+0041 'A') to its regional-indicator
 * symbol (U+1F1E6). Adding it to a letter's code point yields the indicator.
 */
const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - 0x41; // 'A'.charCodeAt(0)

/**
 * Return the regional-indicator flag emoji for a 2-letter alpha-2 country code,
 * or "" for any missing/invalid input. Decorative only.
 */
export function flagEmoji(countryCode?: string): string {
  if (typeof countryCode !== "string") return "";
  if (!ALPHA2.test(countryCode)) return "";

  const upper = countryCode.toUpperCase();
  const first = upper.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET;
  const second = upper.charCodeAt(1) + REGIONAL_INDICATOR_OFFSET;

  return String.fromCodePoint(first, second);
}
