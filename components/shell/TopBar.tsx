import { t } from "@/lib/i18n";

// Top bar (FR-SHELL-01): the only navigation chrome. Logo + a theme indicator
// reflecting the OS color-scheme preference + a slot for the live clock (the
// functional clock arrives in the top-clock slice).
//
// Server component: the theme indicator is pure CSS (see globals.css), so no
// client JavaScript is needed here.

export interface TopBarProps {
  /** Slot for the live clock (top-clock slice mounts a client component here). */
  clock?: React.ReactNode;
}

export function TopBar({ clock }: TopBarProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold"
          >
            {t("appName").slice(0, 1)}
          </span>
          <span className="text-base font-semibold text-foreground">
            {t("appName")}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Clock slot — only rendered when the top-clock slice provides a
              clock, so no empty named element is exposed to assistive tech.
              The clock component carries its own accessible name (from the i18n
              table), so this wrapper is presentation-only — no duplicate label. */}
          {clock ? (
            <div className="text-sm text-muted-foreground">{clock}</div>
          ) : null}

          {/* Theme indicator: pure-CSS reflection of the active OS theme. */}
          <span className="theme-indicator text-sm text-muted-foreground">
            <span data-theme="light" className="inline-flex items-center gap-1">
              {t("themeLightLabel")}
            </span>
            <span data-theme="dark" className="inline-flex items-center gap-1">
              {t("themeDarkLabel")}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
