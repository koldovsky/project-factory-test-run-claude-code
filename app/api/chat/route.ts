// In-app agent — Part 2 (docs/day-03-skills-demo.md §4). The Vercel AI SDK hosts
// the agent INSIDE the app: the model calls two tools (the model ranks), and the
// client renders the result as generative UI (the shared RecommendationCard).
//
// Requires OPENAI_API_KEY in the server env (this is the one keyed surface; the
// rest of the app stays keyless). Model overridable via OPENAI_MODEL.

import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";

import { resolveDates } from "@/lib/recommend/dates";
import { buildRecommendation, type PublishInput } from "@/lib/recommend/publish";
import { getWeatherTable } from "@/lib/recommend/weatherTable";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const SYSTEM = `Ти — асистент застосунку Weather Explorer. Допомагаєш обрати, куди поїхати в Україні на найближчі дні за погодою.

Алгоритм:
1) Виклич інструмент getWeatherTable з полем "when" (today | tomorrow | this-weekend | next-3-days) або явними "dates" (YYYY-MM-DD, у межах ~7 днів).
2) САМ проранжуй міста під критерій користувача (прохолода, тепло, без дощу, сонячно, "для прогулянок" тощо). "comfort" — лише підказка, не відповідь.
3) Виклич інструмент showRecommendation: передай оригінальний "question", короткий "criterion" словами користувача, 1–2 речення "summary", ті самі "dates" і впорядкований "ranked" (топ ~5; "name" точно як у таблиці; "score" 0–100, де вище = краще під критерій; короткий "note").
4) Дай коротку відповідь українською: назви найкраще місто й одне-два інші. Без окличних знаків.

Використовуй лише міста з таблиці. Не вигадуй погоду чи міста.`;

export async function POST(req: Request): Promise<Response> {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Ground the model in the real date — LLMs otherwise default to training-era
  // dates and emit stale years.
  const today = new Date().toISOString().slice(0, 10);
  const dateContext =
    `Сьогодні ${today}. Для відносних дат («ці вихідні», «завтра») ЗАВЖДИ став поле ` +
    `"when" (today | tomorrow | this-weekend | next-3-days), не вигадуй конкретних дат. ` +
    `У showRecommendation передавай ті самі "dates", що повернув getWeatherTable. ` +
    `Став різні "score" під критерій (не однакові для всіх міст).`;

  const result = streamText({
    model: openai(MODEL),
    system: `${dateContext}\n\n${SYSTEM}`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(6),
    tools: {
      getWeatherTable: tool({
        description:
          "Отримати погодну таблицю по всіх містах-кандидатах на задані дати (метрики для ранжування).",
        inputSchema: z.object({
          when: z.enum(["today", "tomorrow", "this-weekend", "next-3-days"]).optional(),
          dates: z.array(z.string()).optional(),
        }),
        execute: async ({ when, dates }) => getWeatherTable(resolveDates({ when, dates }, new Date())),
      }),
      showRecommendation: tool({
        description:
          "Опублікувати твоє ранжування у застосунку (рендериться як картка рекомендації). Виклич після того, як проранжував міста.",
        inputSchema: z.object({
          question: z.string().optional(),
          criterion: z.string(),
          summary: z.string().optional(),
          dates: z.array(z.string()).optional(),
          ranked: z.array(
            z.object({
              name: z.string(),
              score: z.number(),
              note: z.string().optional(),
            }),
          ),
        }),
        // Validate/ground the model's ranking exactly like the skill's /api/publish.
        execute: async (input) => buildRecommendation(input as PublishInput),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
