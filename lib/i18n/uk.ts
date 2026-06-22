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

  // Forecast (FR-FORECAST-01..05, BC-BRAND-01). Calm tone, no exclamation marks.
  // The fetch-failure / empty-payload / invalid-coords states all reuse the same
  // calm inline message and retry control.
  forecastError: "Не вдалося завантажити прогноз зараз. Спробуйте ще раз.",
  forecastRetry: "Спробувати ще раз",

  // Hourly temperature chart accessible name (FR-FORECAST-03).
  hourlyChartLabel: "Погодинний прогноз температури на наступні 48 годин",

  // Sunrise / sunset captions under the chart (FR-FORECAST-04).
  sunriseLabel: "Схід сонця",
  sunsetLabel: "Захід сонця",

  // Day-card field labels (FR-FORECAST-02). Short, calm, accessible.
  forecastHighLabel: "Максимум",
  forecastLowLabel: "Мінімум",
  forecastPrecipLabel: "Імовірність опадів",
  forecastWindLabel: "Вітер",

  // Map (FR-MAP-01..05, TC-MAP-01, BC-BRAND-01). Calm tone, no exclamation marks.
  // The map region is a labelled landmark; the attribution text is required by
  // the OSM Tile Usage Policy and must read exactly "© OpenStreetMap
  // contributors"; the loading and tile-failure states keep the footprint and
  // stay calm.
  mapRegionLabel: "Мапа обраного місця",
  mapAttribution: "© OpenStreetMap contributors",
  mapLoading: "Завантаження мапи",
  mapTileError: "Не вдалося завантажити мапу зараз. Спробуйте ще раз.",
  mapClickOutOfRange: "Ця точка поза межами мапи. Оберіть інше місце.",

  // Weekend compare (FR-COMPARE-01..03, BC-BRAND-01, NFR-A11Y-01). Calm tone,
  // no exclamation marks. Pin/unpin/make-active accessible names compose the
  // base verb with the city name in the component (e.g. "Закріпити Київ").
  comparePinAction: "Закріпити",
  compareUnpinAction: "Прибрати",
  comparePinBarLabel: "Закріплені міста",
  comparePinCurrent: "Закріпити це місто",
  compareLimitNotice: "Можна порівнювати щонайбільше три міста. Приберіть одне, щоб додати інше.",
  compareToggleLabel: "Порівняти вихідні",
  compareMakeActiveAction: "Зробити активним",
  compareEmptyTitle: "Поки що немає закріплених міст",
  compareEmptyHint: "Закріпіть місто, щоб порівняти прогноз на вихідні.",
  compareColumnError: "Не вдалося завантажити прогноз для цього міста. Спробуйте ще раз.",
  compareColumnRetry: "Спробувати ще раз",
  compareColumnLoading: "Завантаження прогнозу",
  compareSaturdayLabel: "Субота",
  compareSundayLabel: "Неділя",
  compareNoWeekendData: "Немає даних на вихідні.",
  compareTableLabel: "Порівняння погоди на вихідні",
} as const;
