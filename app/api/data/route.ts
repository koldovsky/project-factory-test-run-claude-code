// Weather-table endpoint (docs/day-03-skills-demo.md §7, Stage 2 decoupled).
//
// The skill's `data` step GETs this instead of importing lib in-process, so the
// skill can run from anywhere (another repo, another harness) with only Node +
// this URL. The server resolves the dates and computes the all-city table.

import { resolveDates } from "@/lib/recommend/dates";
import { getWeatherTable } from "@/lib/recommend/weatherTable";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const when = url.searchParams.get("when") ?? undefined;
  const datesParam = url.searchParams.get("dates");
  const dates = resolveDates(
    { when, dates: datesParam ? datesParam.split(",") : undefined },
    new Date(),
  );
  const table = await getWeatherTable(dates);
  return Response.json(table);
}
