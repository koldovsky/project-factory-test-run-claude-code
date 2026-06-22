import Link from "next/link";

import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { t } from "@/lib/i18n";

// Top bar (FR-SHELL-01): the only navigation chrome. Logo (a home link back to
// the empty-state search — BUG-002) + a clickable theme toggle (ADR-0007) + a
// slot for the live clock.

export interface TopBarProps {
  /** Slot for the live clock (top-clock slice mounts a client component here). */
  clock?: React.ReactNode;
}

export function TopBar({ clock }: TopBarProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          aria-label={t("homeLinkLabel")}
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            aria-hidden="true"
            className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold"
          >
            {t("appName").slice(0, 1)}
          </span>
          <span className="text-base font-semibold text-foreground">
            {t("appName")}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Clock slot — only rendered when the top-clock slice provides a
              clock, so no empty named element is exposed to assistive tech.
              The clock component carries its own accessible name (from the i18n
              table), so this wrapper is presentation-only — no duplicate label. */}
          {clock ? (
            <div className="text-sm text-muted-foreground">{clock}</div>
          ) : null}

          {/* Clickable theme toggle (ADR-0007): system default, click to override. */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
