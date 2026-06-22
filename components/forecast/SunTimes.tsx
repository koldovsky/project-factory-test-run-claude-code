import { Sunrise, Sunset } from "lucide-react";

import { t } from "@/lib/i18n";

// Today's sunrise / sunset (FR-FORECAST-04). Server component: small static text
// shown under the hourly chart. The timestamps are the active location's
// LOCAL day-0 `sunrise`/`sunset` (timezone=auto), already mapped by
// `lib/weather`; this only renders the "HH:mm" portion with Ukrainian labels.

export interface SunTimesProps {
  /** Today's sunrise "YYYY-MM-DDTHH:mm", location-local. */
  sunrise: string;
  /** Today's sunset "YYYY-MM-DDTHH:mm", location-local. */
  sunset: string;
}

/** Extract the "HH:mm" portion of a local "YYYY-MM-DDTHH:mm" string. */
function timeOfDay(timestamp: string): string {
  const time = timestamp.split("T")[1] ?? "";
  return time.slice(0, 5);
}

export function SunTimes({ sunrise, sunset }: SunTimesProps) {
  return (
    <p className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Sunrise aria-hidden="true" className="size-4" />
        <span>
          {t("sunriseLabel")} {timeOfDay(sunrise)}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Sunset aria-hidden="true" className="size-4" />
        <span>
          {t("sunsetLabel")} {timeOfDay(sunset)}
        </span>
      </span>
    </p>
  );
}
