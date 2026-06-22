"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { t } from "@/lib/i18n";

// Clickable theme toggle (FR-SHELL-01, ADR-0007). Replaces the old read-only
// indicator, which looked interactive but did nothing. Default follows the OS
// (prefers-color-scheme); a click overrides it via `data-theme` on <html> and
// persists the choice in localStorage (a UI preference, not a tracking cookie —
// BC-PRIVACY-03 unaffected). A no-flash script in the layout applies the stored
// choice before paint.
//
// State comes from `useSyncExternalStore` (the project's pattern for browser
// state, as in Clock) — no synchronous setState in an effect. The server
// snapshot is null, so the server and the first client (hydration) render agree;
// the real theme resolves right after hydration.

type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  window.addEventListener("themechange", callback);
  return () => {
    mq.removeEventListener("change", callback);
    window.removeEventListener("themechange", callback);
  };
}

function getSnapshot(): Theme {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot(): Theme | null {
  return null;
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";

  const toggle = () => {
    const next: Theme = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage may be unavailable (private mode); the toggle still works
      // for the session.
    }
    window.dispatchEvent(new Event("themechange"));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("themeToggleLabel")}
      aria-pressed={isDark}
      className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {isDark ? (
        <Moon aria-hidden="true" className="size-4" />
      ) : (
        <Sun aria-hidden="true" className="size-4" />
      )}
      <span suppressHydrationWarning>
        {theme ? (isDark ? t("themeDarkLabel") : t("themeLightLabel")) : t("themeToggleLabel")}
      </span>
    </button>
  );
}
