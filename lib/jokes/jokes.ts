// Curated, local, in-repo list of Ukrainian weather-themed jokes
// (FR-JOKES-01). Calm, practical tone — no exclamation marks, no emoji
// (BC-BRAND-01, NFR-I18N-01). Local only: no network, no external joke API
// (BC-PRIVACY-01).
//
// Pure data (TC-PURE-01): no react/next/DOM imports.
//
// Contract (lib/jokes/jokes.test.ts):
//   - non-empty, at least two entries so the daily selection can rotate
//   - every entry a non-empty trimmed string, no duplicates
//   - Cyrillic in every entry, no Latin letters, no "!"/"！", no emoji

export const JOKES: readonly string[] = [
  "Синоптик пообіцяв ясний день, тож парасолька знову їде у відпустку разом зі мною.",
  "Дощ накрапає тихенько, наче нагадує не поспішати дорогою.",
  "Туман зранку — це коли місто вирішило поспати ще трошки під ковдрою.",
  "Вітер сьогодні чемний, лише поправляє зачіски перехожим.",
  "Перший сніг падає так обережно, ніби боїться розбудити калюжі.",
  "Спека така лагідна, що навіть тінь попросила собі тінь.",
  "Хмари радяться над містом, а ми тим часом п'ємо чай і чекаємо рішення.",
  "Прогноз обіцяв сонце, але хмари мали власні плани на вихідні.",
  "Гроза десь далеко бурчить, наче сусід пересуває меблі.",
  "Осінній вітер збирає листя в купки, а потім сам же їх і розкидає.",
  "Мороз малює на вікнах візерунки, бо влітку не встиг намалювати.",
  "Літня злива пройшла швидко, лишивши по собі свіже повітря і вдячні квіти.",
] as const;
