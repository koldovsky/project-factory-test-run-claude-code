// Custom MCP server — Day 03 Part 4 (docs/day-03-skills-demo.md §6).
//
// Exposes the SAME lib/recommend core as Model Context Protocol tools, so ANY
// MCP client (Claude Desktop, Claude Code, Cursor, Hermes…) can call it as native
// tools — no bespoke skill, no HTTP glue. It mirrors the in-app GenUI design:
//   • get_weather_table — the data (the agent reasons over it),
//   • recommend         — the agent's ranking, grounded + validated.
// Pure lib + stdio; the app itself need not be running.
//
//   Connect (Claude Code):  claude mcp add weather -- npx tsx mcp/weather.ts
//   Run directly:           npx tsx mcp/weather.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  buildRecommendation,
  getWeatherTable,
  resolveDates,
  type PublishInput,
} from "../lib/recommend";

const server = new McpServer({ name: "weather-explorer", version: "0.1.0" });

// Tool 1 — DATA. Fetch every candidate city's forecast for the dates and return a
// compact per-city table. No ranking here: the connecting agent decides the order.
server.registerTool(
  "get_weather_table",
  {
    title: "Weather table",
    description:
      "Погодна таблиця по всіх містах-кандидатах України на задані дати (метрики для ранжування).",
    inputSchema: {
      when: z.enum(["today", "tomorrow", "this-weekend", "next-3-days"]).optional(),
      dates: z.array(z.string()).optional(),
    },
  },
  async ({ when, dates }) => {
    const table = await getWeatherTable(resolveDates({ when, dates }, new Date()));
    return { content: [{ type: "text", text: JSON.stringify(table) }] };
  },
);

// Tool 2 — PUBLISH. The agent sends its ranking; buildRecommendation grounds it
// (names resolved against the curated CITIES, scores clamped, order normalised).
server.registerTool(
  "recommend",
  {
    title: "Publish ranking",
    description:
      "Заземлити твоє ранжування міст у валідовану рекомендацію (імена лише з курованого списку, бали 0–100).",
    inputSchema: {
      question: z.string().optional(),
      criterion: z.string(),
      summary: z.string().optional(),
      dates: z.array(z.string()).optional(),
      ranked: z.array(
        z.object({ name: z.string(), score: z.number(), note: z.string().optional() }),
      ),
    },
  },
  async (input) => {
    const rec = buildRecommendation(input as PublishInput);
    return { content: [{ type: "text", text: JSON.stringify(rec) }] };
  },
);

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
  // stdout is the protocol channel; logs go to stderr.
  console.error("weather-explorer MCP server ready (stdio).");
}

main().catch((err) => {
  console.error("weather MCP failed:", err);
  process.exit(1);
});
