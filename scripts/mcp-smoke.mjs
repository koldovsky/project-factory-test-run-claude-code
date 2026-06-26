// Smoke-test the weather MCP server over stdio (Day 03 Part 4 proof).
// Spawns mcp/weather.ts via tsx, then: initialize → tools/list → call both tools.
// Run: node scripts/mcp-smoke.mjs   (or: npm run mcp:smoke)

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath, // node
  args: ["--import", "tsx", "mcp/weather.ts"],
  cwd: process.cwd(),
});

const client = new Client({ name: "mcp-smoke", version: "0.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log("tools/list →", tools.map((t) => t.name).join(", "));

const wtRes = await client.callTool({
  name: "get_weather_table",
  arguments: { when: "this-weekend" },
});
const table = JSON.parse(wtRes.content[0].text);
console.log(`get_weather_table → ${table.cities.length} міст, дати ${table.dates.join(", ")}`);
const top = [...table.cities].sort((a, b) => b.comfort - a.comfort)[0];
if (top) console.log(`  напр. ${top.nameUk}: ${top.feelsLikeMaxC}°, комфорт ${top.comfort}`);

const recRes = await client.callTool({
  name: "recommend",
  arguments: {
    criterion: "прохолода",
    dates: table.dates,
    ranked: [
      { name: "Ужгород", score: 92, note: "найсвіжіше" },
      { name: "Львів", score: 80, note: "комфортно" },
      { name: "Атлантида", score: 50, note: "неіснуюче" },
    ],
  },
});
const rec = JSON.parse(recRes.content[0].text);
console.log(`recommend → winner ${rec.winner?.nameEn}; ranked ${rec.ranked.map((c) => c.nameEn).join(", ")}`);
if (rec.notes.length) console.log(`  notes: ${rec.notes.join(" | ")}`);

await client.close();
console.log("OK — MCP server verified");
