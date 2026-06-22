// English mirror of the Ukrainian source of truth (`uk.ts`). Same key set,
// exactly — enforced by the i18n unit tests. English is a fallback only; the
// MVP ships no language switcher (NFR-I18N-01).
//
// Pure data (TC-PURE-01): no react/next/DOM imports.

import type { MessageKey } from "./index";

export const en: Record<MessageKey, string> = {
  // Branding / chrome.
  appName: "Weather",
  homeLinkLabel: "Weather — home",

  // Empty-state hero (FR-SHELL-03).
  heroTitle: "Check the weather in any city",
  heroSubtitle:
    "Enter a city name to see the week's forecast and plan your trip.",
  searchPlaceholder: "Find a city",
  searchLabel: "City search",

  // City search states (FR-SEARCH-05, FR-SEARCH-06, BC-BRAND-01).
  searchSuggestionsLabel: "City suggestions",
  searchNothingFound: "Nothing found. Try a different name.",
  searchError: "Could not load suggestions. Check your connection and try again.",
  searchRetry: "Try again",
  searchUseMyLocation: "My location",
  searchLocating: "Detecting your location",
  searchGeoUnsupported: "Geolocation is unavailable in this browser. Use search instead.",

  // Clock slot accessible name (FR-CLOCK-01; filled by the top-clock slice).
  clockRegionLabel: "Local time",

  // Theme toggle (FR-SHELL-01, ADR-0007).
  themeLightLabel: "Light theme",
  themeDarkLabel: "Dark theme",
  themeToggleLabel: "Toggle theme",

  // Footer credits (FR-SHELL-01, BC-BRAND-02).
  footerCreditsIntro: "Data provided by",
  footerOpenMeteoLabel: "Open-Meteo — weather forecast",
  footerOpenStreetMapLabel: "OpenStreetMap — map data",

  // Deep-link fallback notice (FR-SHELL-03).
  deepLinkErrorNotice:
    "We could not open this link. Try searching for a city instead.",

  // Comfort badge (FR-COMFORT-04, NFR-A11Y).
  comfortBadgeLabel: "Comfort",
  comfortBandGreenLabel: "favorable",
  comfortBandYellowLabel: "moderate",
  comfortBandRedLabel: "unfavorable",

  // Weekend summary (FR-COMFORT-05).
  comfortWeekendTitle: "Weekend comfort",
  comfortWeekendPartialNote: "Data for one weekend day only.",

  // Forecast (FR-FORECAST-01..05, BC-BRAND-01).
  forecastError: "We could not load the forecast right now. Try again.",
  forecastRetry: "Try again",

  // Hourly temperature chart accessible name (FR-FORECAST-03).
  hourlyChartLabel: "Hourly temperature forecast for the next 48 hours",

  // Sunrise / sunset captions under the chart (FR-FORECAST-04).
  sunriseLabel: "Sunrise",
  sunsetLabel: "Sunset",

  // Day-card field labels (FR-FORECAST-02).
  forecastHighLabel: "High",
  forecastLowLabel: "Low",
  forecastPrecipLabel: "Precipitation probability",
  forecastWindLabel: "Wind",

  // Map (FR-MAP-01..05, TC-MAP-01, BC-BRAND-01).
  mapRegionLabel: "Map of the selected location",
  mapAttribution: "© OpenStreetMap contributors",
  mapLoading: "Loading map",
  mapTileError: "We could not load the map right now. Try again.",
  mapClickOutOfRange: "That point is outside the map bounds. Pick another spot.",

  // Weekend compare (FR-COMPARE-01..03, BC-BRAND-01, NFR-A11Y-01).
  comparePinAction: "Pin",
  compareUnpinAction: "Remove",
  comparePinBarLabel: "Pinned cities",
  comparePinCurrent: "Pin this city",
  compareLimitNotice: "You can compare at most three cities. Remove one to add another.",
  compareToggleLabel: "Compare weekend",
  compareMakeActiveAction: "Make active",
  compareEmptyTitle: "No cities pinned yet",
  compareEmptyHint: "Pin a city to compare the weekend forecast.",
  compareColumnError: "We could not load the forecast for this city. Try again.",
  compareColumnRetry: "Try again",
  compareColumnLoading: "Loading forecast",
  compareSaturdayLabel: "Saturday",
  compareSundayLabel: "Sunday",
  compareNoWeekendData: "No weekend data.",
  compareTableLabel: "Weekend weather comparison",
};
