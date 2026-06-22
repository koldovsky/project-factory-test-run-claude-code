"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

// Calm inline forecast error (FR-FORECAST-01, NFR-OBS-01, BC-BRAND-01).
//
// Every non-happy forecast outcome — network/non-2xx, 200-but-empty/incomplete,
// null sun times, malformed body, invalid coordinates — routes here rather than
// to a 500 page or a blank area. The message is calm Ukrainian with no
// exclamation marks; the retry control has an accessible name and the shared
// visible focus ring. Retry re-issues the fetch by refreshing the server render
// for the ACTIVE location (`router.refresh()`); a repeated failure keeps this
// same calm state, with retry still activatable for a further attempt.
//
// Client component: it owns the retry interaction. The copy comes from
// `lib/i18n`; this renders no inline strings.

export function ForecastError() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // A monotonically advancing key lets a repeated refresh re-run even if the
  // server output is identical, so the retry stays activatable for each attempt.
  const [, setAttempt] = useState(0);

  const handleRetry = useCallback(() => {
    setAttempt((n) => n + 1);
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  return (
    <div
      role="alert"
      className="col-span-full mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-md border border-border bg-muted px-4 py-6 text-center text-sm text-muted-foreground"
    >
      <p>{t("forecastError")}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRetry}
        disabled={isPending}
      >
        {t("forecastRetry")}
      </Button>
    </div>
  );
}
