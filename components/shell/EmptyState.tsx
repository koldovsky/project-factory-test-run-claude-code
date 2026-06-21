import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";

// First-load empty state (FR-SHELL-03): hero copy plus a prominently centered
// city search. The functional search arrives in the city-search slice; here we
// render an accessible placeholder input in the centered slot. No forecast, map,
// or other location-dependent content is rendered.
//
// Server component: static markup. The placeholder input is non-interactive but
// keyboard-focusable with a visible focus ring and an accessible name (i18n).

export interface EmptyStateProps {
  /** Optional override for the centered search slot (city-search slice). */
  search?: React.ReactNode;
}

export function EmptyState({ search }: EmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex max-w-2xl flex-col items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("heroTitle")}
        </h1>
        <p className="max-w-prose text-base text-muted-foreground sm:text-lg">
          {t("heroSubtitle")}
        </p>
      </div>

      <div className="w-full max-w-md">
        {search ?? (
          <Input
            type="search"
            aria-label={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
          />
        )}
      </div>
    </div>
  );
}
