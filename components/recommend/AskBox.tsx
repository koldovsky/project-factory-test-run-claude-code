"use client";

// Browser "ask" box (docs/day-03-skills-demo.md §7). Posts a natural-language
// question to /api/ask (the agent's inbox). It does NOT reason — the agent picks
// the question up via the watch loop, thinks with the where-to-go skill, and the
// panel reflects the result. Status is shown by the parent panel via polling.

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AskBox() {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    try {
      await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      setQuestion("");
    } catch {
      // Calm: surfaced indirectly via the panel's inbox/error state.
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Куди поїхати на ці вихідні, хочу до моря?"
        aria-label="Запит до агента"
        disabled={busy}
      />
      <Button type="submit" disabled={busy || !question.trim()}>
        {busy ? "…" : "Запитати"}
      </Button>
    </form>
  );
}
