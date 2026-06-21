// Ukrainian source of truth for all shell UI strings (NFR-I18N-01).
//
// Ukrainian-first, calm, practical tone: no exclamation marks, no emojis,
// no hype (BC-BRAND-01). This is the single table the components read from —
// no hard-coded inline strings anywhere in the UI. `en.ts` mirrors this key
// set exactly; `index.ts` derives `MessageKey` from this object.
//
// Pure data (TC-PURE-01): no react/next/DOM imports.

export const uk = {
  // Branding / chrome.
  appName: "Погода",
  logoAlt: "Логотип застосунку Погода",

  // Empty-state hero (FR-SHELL-03).
  heroTitle: "Дізнайтеся погоду у будь-якому місті",
  heroSubtitle:
    "Введіть назву міста, щоб переглянути прогноз на тиждень і спланувати поїздку.",
  searchPlaceholder: "Знайдіть місто",
  searchLabel: "Пошук міста",

  // Theme indicator (FR-SHELL-01). Accessible names for each active theme.
  themeLightLabel: "Світла тема",
  themeDarkLabel: "Темна тема",

  // Footer credits (FR-SHELL-01, BC-BRAND-02).
  footerCreditsIntro: "Дані надано",
  footerOpenMeteoLabel: "Open-Meteo — прогноз погоди",
  footerOpenStreetMapLabel: "OpenStreetMap — картографічні дані",

  // Deep-link fallback notice (FR-SHELL-03).
  deepLinkErrorNotice:
    "Не вдалося відкрити посилання. Спробуйте знайти місто у пошуку.",

  // Location-view placeholder (forecast arrives in a later slice).
  locationLoadingTitle: "Завантаження прогнозу",
  locationLoadingHint: "Готуємо прогноз для обраного міста.",
} as const;
