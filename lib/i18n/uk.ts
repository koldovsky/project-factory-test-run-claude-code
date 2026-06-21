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

  // Empty-state hero (FR-SHELL-03).
  heroTitle: "Дізнайтеся погоду у будь-якому місті",
  heroSubtitle:
    "Введіть назву міста, щоб переглянути прогноз на тиждень і спланувати поїздку.",
  searchPlaceholder: "Знайдіть місто",
  searchLabel: "Пошук міста",

  // City search states (FR-SEARCH-05, FR-SEARCH-06, BC-BRAND-01). Calm tone,
  // no exclamation marks. The suggestion list is a labelled listbox.
  searchSuggestionsLabel: "Підказки міст",
  searchNothingFound: "Нічого не знайдено. Спробуйте іншу назву.",
  searchError: "Не вдалося завантажити підказки. Перевірте звʼязок і спробуйте ще раз.",
  searchRetry: "Спробувати ще раз",
  searchUseMyLocation: "Моє місцезнаходження",
  searchLocating: "Визначаємо місцезнаходження",

  // Clock slot accessible name (FR-CLOCK-01; filled by the top-clock slice).
  clockRegionLabel: "Місцевий час",

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

  // Comfort badge (FR-COMFORT-04, NFR-A11Y). Accessible name must convey the
  // value and band in words, never by color alone. The badge composes
  // `comfortBadgeLabel + value + comfortBand<…>Label`.
  comfortBadgeLabel: "Комфорт",
  comfortBandGreenLabel: "сприятливо",
  comfortBandYellowLabel: "помірно",
  comfortBandRedLabel: "несприятливо",

  // Weekend summary (FR-COMFORT-05).
  comfortWeekendTitle: "Комфорт на вихідні",
  comfortWeekendPartialNote: "Дані лише за один день вихідних.",
} as const;
