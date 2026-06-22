// English mirror of the Ukrainian source of truth (`uk.ts`). Same key set,
// exactly — enforced by the i18n unit tests. English is a fallback only; the
// MVP ships no language switcher (NFR-I18N-01).
//
// Pure data (TC-PURE-01): no react/next/DOM imports.

import type { MessageKey } from "./index";

export const en: Record<MessageKey, string> = {
  // Branding / chrome.
  appName: "Weather",

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

  // Clock slot accessible name (FR-CLOCK-01; filled by the top-clock slice).
  clockRegionLabel: "Local time",

  // Theme indicator (FR-SHELL-01).
  themeLightLabel: "Light theme",
  themeDarkLabel: "Dark theme",

  // Footer credits (FR-SHELL-01, BC-BRAND-02).
  footerCreditsIntro: "Data provided by",
  footerOpenMeteoLabel: "Open-Meteo — weather forecast",
  footerOpenStreetMapLabel: "OpenStreetMap — map data",

  // Deep-link fallback notice (FR-SHELL-03).
  deepLinkErrorNotice:
    "We could not open this link. Try searching for a city instead.",

  // Location-view placeholder.
  locationLoadingTitle: "Loading forecast",
  locationLoadingHint: "Preparing the forecast for the selected city.",

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
};
