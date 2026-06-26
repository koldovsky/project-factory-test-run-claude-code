// Shared presentational card for a recommendation (docs/day-03-skills-demo.md).
//
// Used by BOTH Part 1 (RecommendationPanel — external agent drives the app) and
// Part 2 (the in-app AI SDK assistant — generative UI). Pure presentation: it
// renders whatever Recommendation it is handed, with an optional footer. No data
// fetching, no state. Calm, Ukrainian-first, no exclamation marks.

import type { ComfortBand } from "@/lib/scoring/band";
import type { RankedCity, Recommendation } from "@/lib/recommend/types";

export type RecPayload = Recommendation & { generatedAt?: string };

const BAND_STYLES: Record<ComfortBand, string> = {
  green: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  yellow: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  red: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function ScorePill({ score, band }: { score: number; band: ComfortBand }) {
  return (
    <span
      className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-full px-2 py-0.5 text-sm font-medium ${BAND_STYLES[band]}`}
    >
      {score}
    </span>
  );
}

function CityRow({ city, rank }: { city: RankedCity; rank: number }) {
  return (
    <li className="flex items-center gap-3 py-1.5">
      <span className="w-5 text-right text-sm tabular-nums text-muted-foreground">{rank}</span>
      <ScorePill score={city.score} band={city.band} />
      <span className="min-w-0 flex-1">
        <a href={city.deepLink} className="font-medium underline-offset-4 hover:underline">
          {city.nameUk}
        </a>
        <span className="block truncate text-xs text-muted-foreground">{city.note}</span>
      </span>
    </li>
  );
}

export function RecommendationCard({
  rec,
  footer,
}: {
  rec: RecPayload;
  footer?: React.ReactNode;
}) {
  const rest = rec.winner ? rec.ranked.slice(1, 5) : [];
  return (
    <div className="flex flex-col gap-3">
      {rec.question ? (
        <p className="text-sm">
          <span className="text-muted-foreground">Запит: </span>«{rec.question}»
        </p>
      ) : null}
      {rec.summary ? <p className="text-sm">{rec.summary}</p> : null}

      <p className="text-xs text-muted-foreground">
        Дати: {rec.query.dates.join(", ") || "найближчі дні"} · критерій: {rec.query.criterion}
      </p>

      {rec.winner ? (
        <div className="flex items-center gap-3">
          <ScorePill score={rec.winner.score} band={rec.winner.band} />
          <div className="min-w-0">
            <a
              href={rec.winner.deepLink}
              className="text-xl font-semibold underline-offset-4 hover:underline"
            >
              {rec.winner.nameUk}
            </a>
            <p className="text-sm text-muted-foreground">{rec.winner.note}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Не вдалося підібрати місто за цим запитом.</p>
      )}

      {rest.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Інші варіанти
          </p>
          <ul className="divide-y divide-border">
            {rest.map((city, i) => (
              <CityRow key={city.nameEn} city={city} rank={i + 2} />
            ))}
          </ul>
        </div>
      ) : null}

      {rec.notes.length > 0 ? (
        <ul className="text-xs text-muted-foreground">
          {rec.notes.map((note, i) => (
            <li key={`${i}-${note}`}>{note}</li>
          ))}
        </ul>
      ) : null}

      {footer ? (
        <p className="border-t border-border pt-3 text-xs text-muted-foreground">{footer}</p>
      ) : null}
    </div>
  );
}
