import { t } from "@/lib/i18n";
import { dayOfYear, selectJoke } from "@/lib/jokes/select";

// Footer (FR-SHELL-01, BC-BRAND-02): credits Open-Meteo and OpenStreetMap, each
// a working hyperlink with an accessible name from i18n, visible focus styles,
// and safe target/rel for external links (NFR-A11Y-01).
//
// Also shows a calm daily Ukrainian weather joke (FR-JOKES-01). The joke is
// selected server-side from a stable day-of-year index, so the SSR markup and
// client hydration agree (no Math.random/Date.now in lib) — no hydration
// mismatch. selectJoke is total: an empty list degrades to a calm fallback, so
// the footer never crashes or blanks.
//
// Server component: static markup only.

export function Footer() {
  const joke = selectJoke(dayOfYear(new Date()));

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2">
          <span>{t("footerCreditsIntro")}</span>
          <span className="flex items-center gap-2">
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("footerOpenMeteoLabel")}
              className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Open-Meteo
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://www.openstreetmap.org/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("footerOpenStreetMapLabel")}
              className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              OpenStreetMap
            </a>
          </span>
        </div>
        {joke ? <p className="text-muted-foreground/80">{joke}</p> : null}
      </div>
    </footer>
  );
}
