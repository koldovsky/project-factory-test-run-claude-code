"use client";

// Live "where to go" panel — Part 1 surface (docs/day-03-skills-demo.md §3).
//
// One agent console in the app: an ask box (browser -> agent inbox), a
// "thinking" state, the agent's current answer (rendered via the shared
// RecommendationCard), and a query-history list. Polls /api/agent-state; fetches
// /api/history when a new result lands. The external agent does the reasoning —
// this panel only shows input + output. Calm, Ukrainian-first, no exclamations.
//
// Freshness: a recommendation from a PREVIOUS session is NOT shown as the current
// answer on load (only one newer than the value present at mount, or an in-flight
// question, renders as current). Past results live in the history list.

import { useEffect, useRef, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HistoryEntry } from "@/lib/recommend/history";
import { AskBox } from "./AskBox";
import { RecommendationCard, type RecPayload } from "./RecommendationCard";

type Inbox = {
  id: string;
  question: string;
  status: "pending" | "processing" | "answered" | "error";
  note?: string;
} | null;
type State = { recommendation: RecPayload | null; inbox: Inbox };

const POLL_MS = 1500;

function fmtTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function HistoryList({
  entries,
  expandedId,
  onToggleEntry,
}: {
  entries: HistoryEntry[];
  expandedId: string | null;
  onToggleEntry: (id: string) => void;
}) {
  return (
    <ul className="mt-2 flex flex-col gap-0.5">
      {entries.map((e) => (
        <li key={e.id} className="rounded-md">
          <button
            type="button"
            onClick={() => onToggleEntry(e.id)}
            className="flex w-full items-center gap-2 py-1 text-left text-sm hover:underline"
          >
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {fmtTime(e.generatedAt)}
            </span>
            <span className="min-w-0 flex-1 truncate">«{e.question ?? e.query.criterion}»</span>
            {e.winner ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                {e.winner.nameUk} {e.winner.score}
              </span>
            ) : null}
          </button>
          {expandedId === e.id ? (
            <div className="pb-2 pl-1">
              <RecommendationCard rec={e} footer={`Попередній результат · ${fmtTime(e.generatedAt)}`} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function RecommendationPanel() {
  const [state, setState] = useState<State>({ recommendation: null, inbox: null });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // The generatedAt present at mount — anything newer is "this session". Kept in
  // state (read during render) and pinned once via a ref (touched only in effect).
  const [baseline, setBaseline] = useState<string | null | undefined>(undefined);
  const baselineSetRef = useRef(false);

  useEffect(() => {
    let alive = true;
    let lastGen: string | null | undefined;
    let historyFetched = false;
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history", { cache: "no-store" });
        const data: { history?: HistoryEntry[] } = await res.json();
        if (alive) setHistory(Array.isArray(data.history) ? data.history : []);
      } catch {
        // Calm: keep the last history on a transient failure.
      }
    };
    const tick = async () => {
      try {
        const res = await fetch("/api/agent-state", { cache: "no-store" });
        const data: State = await res.json();
        if (!alive) return;
        if (!baselineSetRef.current) {
          baselineSetRef.current = true;
          setBaseline(data.recommendation?.generatedAt ?? null);
        }
        const gen = data.recommendation?.generatedAt;
        if (!historyFetched || gen !== lastGen) {
          historyFetched = true;
          lastGen = gen;
          void fetchHistory();
        }
        setState(data);
      } catch {
        // Calm: a transient poll failure keeps the last state.
      }
    };
    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const { recommendation: rec, inbox } = state;
  const thinking = inbox?.status === "pending" || inbox?.status === "processing";
  const isFresh = !!rec?.generatedAt && rec.generatedAt !== baseline;
  const pastEntries =
    isFresh && rec?.generatedAt
      ? history.filter((e) => e.generatedAt !== rec.generatedAt)
      : history;

  let body: React.ReactNode;
  if (thinking) {
    body = (
      <p className="text-sm text-muted-foreground">Агент обмірковує: «{inbox?.question}» …</p>
    );
  } else if (isFresh && rec) {
    body = (
      <RecommendationCard
        rec={rec}
        footer="Сформовано агентом за вашим запитом · панель оновлюється автоматично"
      />
    );
  } else if (inbox?.status === "error") {
    body = (
      <p className="text-sm text-muted-foreground">{inbox.note ?? "Не вдалося обробити запит."}</p>
    );
  } else {
    body = (
      <p className="text-sm text-muted-foreground">
        Напр.:{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
          куди поїхати на ці вихідні, хочу до моря?
        </code>{" "}
        Відповідь зʼявиться тут.
      </p>
    );
  }

  return (
    <section className="col-span-full">
      <Card className="border-primary/30 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Куди поїхати</CardTitle>
          <CardDescription>
            Запитайте агента природною мовою — у полі нижче або в терміналі (Claude
            Code / Hermes). Агент усе обмірковує, відповідь зʼявляється тут.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AskBox />
          {body}

          {pastEntries.length > 0 ? (
            <div className="border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {historyOpen ? "Сховати історію" : `Історія запитів (${pastEntries.length})`}
              </button>
              {historyOpen ? (
                <HistoryList
                  entries={pastEntries}
                  expandedId={expandedId}
                  onToggleEntry={(id) => setExpandedId((cur) => (cur === id ? null : id))}
                />
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
