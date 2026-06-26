---
name: where-to-go
description: Recommends where to travel in Ukraine for given near-term dates by reasoning over live weather. Handles ANY weather preference in the question — cool, warm, dry, sunny, "for hiking", "just nice" — not a fixed set. Use whenever the user asks where to go / the best place to travel / where the weather is best in Ukraine for a weekend or specific upcoming dates.
---

# Where to go (Weather Explorer)

YOU do the ranking. Two thin tools give you the data and publish your answer to
the app; the reasoning in between is yours — so your reply and the app's panel
always show the same thing.

The tools talk to the running app over HTTP, so this skill needs only Node and
the app's URL — no repo, no build. Set `WEATHER_APP_URL` if the app is not at
`http://localhost:3000`. The runner is `run.mjs` in THIS skill's folder; the
examples below use the Claude Code path — under another harness use that harness's
path to this skill (e.g. `~/.hermes/skills/where-to-go/run.mjs`).

## When to use

The user asks things like:
- «куди поїхати на ці вихідні, хочу прохолоду» (cool)
- "where's warmest this weekend?" / "best dry place on Saturday?"
- «куди на вихідні до моря» / "good weekend for hiking?"

## Steps

1. **Work out the dates.** Use `when` = `today` | `tomorrow` | `this-weekend` |
   `next-3-days`, or explicit `dates` (`YYYY-MM-DD`, within ~7 days).

2. **Get the weather table** (all candidate cities):

   ```bash
   node .claude/skills/where-to-go/run.mjs data '{"when":"this-weekend"}'
   ```

   It prints JSON: `{ dates, cities: [{ nameUk, feelsLikeMaxC, precipProbability,
   windKmh, cloudCover, comfort, comfortHint }], notes }`. `comfort` is just one
   signal — for "cool" rank by low `feelsLikeMaxC`, for "dry" by low
   `precipProbability`, etc.

3. **Rank the cities yourself** for the user's actual criterion. Pick the top ~5,
   order best-first, and give each a **score 0–100** (how well it fits the
   criterion — high = best fit) and a short Ukrainian `note`.

4. **Publish your ranking** so the app shows it. Pass:
   - `question` — the user's original question, verbatim;
   - `criterion` — a short label in the user's words (e.g. «прохолода»);
   - `summary` — a 1–2 sentence Ukrainian comment on the answer (this is shown in
     the app above the list, so make it a real takeaway, not a restatement);
   - `dates` — the same dates;
   - `ranked` — your ordered list (names exactly as in the table, with score + note).

   ```bash
   node .claude/skills/where-to-go/run.mjs publish '{"question":"куди поїхати, хочу прохолоду","criterion":"прохолода","summary":"Цими вихідними прохолодніше на сході; найкраще — Суми, близько 25°.","dates":["2026-06-27","2026-06-28"],"ranked":[{"name":"Суми","score":88,"note":"≈25°, найпрохолодніше"},{"name":"Харків","score":85,"note":"≈25°, свіжо"}]}'
   ```

5. **Reply in Ukrainian, describing the ranking you just published** — same
   winner, same order, consistent with your `summary`. The app panel shows exactly
   this (question, comment, and ranking).

## Rules

- **Never describe a different ranking than the one you published.** If your first
  ranking was wrong for the question, publish again with the corrected list — do
  not "fix it" only in prose. The panel is the source of truth and must match.
- Rank for what the user actually asked. `comfort` is a hint, not the answer:
  "хочу прохолоду" must put the COOLEST cities first (low score on comfort is fine).
- Only near-term dates work (7-day horizon). If asked for dates further out, say so
  and offer the closest in-range dates.
- Use only cities from the table; never invent places or weather numbers.
- Tone: calm, Ukrainian-first, no exclamation marks.
