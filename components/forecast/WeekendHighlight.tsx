import { ComfortBadge } from "@/components/comfort/ComfortBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { type WeekendComfort } from "@/lib/scoring/weekend";

// Upcoming-weekend comfort highlight (FR-COMFORT-05). Server component: pure
// presentation over the precomputed `weekendComfort` result. Shows the weekend
// comfort badge and, when only one weekend day is in the window, the calm
// "one day only" note. All copy from `lib/i18n`; no exclamation marks.

export interface WeekendHighlightProps {
  weekend: WeekendComfort;
}

export function WeekendHighlight({ weekend }: WeekendHighlightProps) {
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="text-base font-semibold text-foreground">
          {t("comfortWeekendTitle")}
        </h2>
        <ComfortBadge value={weekend.value} />
      </CardHeader>
      {weekend.partial ? (
        <CardContent className="pt-0 text-sm text-muted-foreground">
          {t("comfortWeekendPartialNote")}
        </CardContent>
      ) : null}
    </Card>
  );
}
