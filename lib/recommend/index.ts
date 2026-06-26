// Public surface of the recommendation domain (docs/day-03-skills-demo.md).
// The agent-ranked flow: getWeatherTable (data) → agent ranks → buildRecommendation
// (publish). Transports (skill runner, future HTTP/MCP) import from here.

export { CITIES } from "./cities";
export type { Candidate, Affinity } from "./cities";
export { resolveDates, datesFromWhen } from "./dates";
export type { WhenKeyword } from "./dates";
export { getWeatherTable } from "./weatherTable";
export type { WeatherTable, CityWeather } from "./weatherTable";
export { buildRecommendation } from "./publish";
export type { PublishInput, RankingEntry } from "./publish";
export { appendHistory, HISTORY_CAP } from "./history";
export type { HistoryEntry } from "./history";
export type { Recommendation, RankedCity } from "./types";
