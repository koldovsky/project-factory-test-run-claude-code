---
name: holiday-weather
description: Suggests the best Ukrainian city for a short trip by weather — for near-term dates and ANY preference (cool, warm, dry, sunny, even rainy). Self-contained: it fetches live weather itself, needs no app, no setup, no API key. Use whenever the user asks where to go / the best place to travel in Ukraine for a weekend or specific upcoming days.
---

# Holiday weather (self-contained)

A portable, zero-dependency skill: one script fetches live weather for Ukraine's
main cities; YOU rank them for the user's preference and answer. Needs only Node +
internet — no app, no build, no API key. The same folder runs in any harness
(Claude Code, Hermes, OpenClaw).

## Steps

1. **Work out the dates.** Use `when` = `today` | `tomorrow` | `this-weekend` |
   `next-3-days`, or explicit `dates` (`YYYY-MM-DD`, within ~7 days).

2. **Run the bundled script** (from this skill's folder — under Claude Code
   `.claude/skills/holiday-weather/run.mjs`; under another harness, the same file
   in that harness's skills dir):

   ```bash
   node run.mjs '{"when":"this-weekend"}'
   ```

   It prints one line per city — `тепловідчуття` (feels-like °C), `опади` (precip %),
   `вітер` (wind km/h), `хмарність` (cloud %), and a `комфорт` hint — sorted by comfort.

3. **Rank the cities yourself** for the user's ACTUAL criterion, using the metrics:
   - прохолода / cool → lowest feels-like;
   - тепло / warm → highest feels-like;
   - без дощу / dry → lowest precip;
   - сонячно / sunny → lowest cloud;
   - дощ / rainy → highest precip;
   - «комфортно» / no preference → the comfort sort as-is.

4. **Answer in Ukrainian**, calmly, no exclamation marks: name the best city and
   one or two alternatives, with the key numbers and a short reason.

## Rules

- Use only cities and numbers from the script output — never invent weather.
- Only near-term dates work (7-day horizon). If asked for dates further out, say so
  and offer the closest in-range dates.
- This skill only answers (terminal/chat). It does not drive any app.
