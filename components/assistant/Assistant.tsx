"use client";

// In-app assistant — Part 2 (docs/day-03-skills-demo.md §4). The agent lives
// INSIDE the app via the Vercel AI SDK: you chat here, the model calls tools, and
// its recommendation renders as generative UI (the shared RecommendationCard).
// No external harness, no file bridge. Calm, Ukrainian-first, no exclamations.

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

import { RecommendationCard, type RecPayload } from "@/components/recommend/RecommendationCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// The default UIMessage carries untyped tool parts; read the fields we render.
type ToolPartLike = { type: string; state?: string; output?: unknown; errorText?: string };

export function Assistant() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    void sendMessage({ text });
    setInput("");
  }

  return (
    <section className="col-span-full">
      <Card className="border-primary/30 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Асистент (вбудований)</CardTitle>
          <CardDescription>
            Агент усередині застосунку (Vercel AI SDK). Запитайте природною мовою —
            відповідь генерується тут, без зовнішнього агента.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {m.role === "user" ? "Ви" : "Асистент"}
              </span>
              {m.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <p key={i} className="whitespace-pre-wrap text-sm">
                      {part.text}
                    </p>
                  );
                }
                const tp = part as unknown as ToolPartLike;
                if (tp.type === "tool-getWeatherTable") {
                  return tp.state === "output-available" ? null : (
                    <p key={i} className="text-xs text-muted-foreground">
                      Дивлюся погоду…
                    </p>
                  );
                }
                if (tp.type === "tool-showRecommendation") {
                  if (tp.state === "output-available") {
                    return <RecommendationCard key={i} rec={tp.output as RecPayload} />;
                  }
                  if (tp.state === "output-error") {
                    return (
                      <p key={i} className="text-xs text-muted-foreground">
                        Помилка: {tp.errorText}
                      </p>
                    );
                  }
                  return (
                    <p key={i} className="text-xs text-muted-foreground">
                      Готую рекомендацію…
                    </p>
                  );
                }
                return null;
              })}
            </div>
          ))}

          <form onSubmit={submit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Куди поїхати на ці вихідні, хочу до моря?"
              aria-label="Запит до асистента"
              disabled={busy}
            />
            <Button type="submit" disabled={busy || !input.trim()}>
              {busy ? "…" : "Запитати"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
