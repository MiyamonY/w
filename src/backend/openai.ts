import { z } from "zod/mini";
import { usedWordNumbers } from "./passages";

const OpenAIEnvSchema = z.object({
  OPENAI_API_KEY: z.string().check(z.minLength(1)),
  OPENAI_MODEL: z.string().check(z.minLength(1)),
});

const PassageSchema = z.object({
  title: z.string().check(z.minLength(1)),
  passage: z.string().check(z.minLength(1)),
});

const CompletionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).check(z.minLength(1)),
});

export type TargetWord = { term: string; meaning: string };
export type GeneratedPassage = { title: string; body: string; model: string };

export class PassageError extends Error {}

const SystemPrompt =
  "You write English reading passages for Japanese learners preparing for the Eiken Grade 1 exam.";

const userPrompt = (words: TargetWord[]) =>
  [
    "Write an engaging, coherent English passage of about 300 words (between 280 and 320 words) on a single topic of your choice, at the level of a quality newspaper or magazine article.",
    "Use every target word below exactly once, in the sense given by its Japanese meaning. You may inflect it (e.g. tense, plural).",
    "Mark each use as {{n|form}}, where n is the target's number and form is the exact text as it appears in the passage, e.g. {{3|squandered}}. Do not mark anything else.",
    "Separate paragraphs with a blank line. Give the passage a short title.",
    "",
    "Target words:",
    ...words.map((w, i) => `${i + 1}. ${w.term} — ${w.meaning}`),
  ].join("\n");

const requestPassage = async (apiKey: string, model: string, words: TargetWord[]) => {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SystemPrompt },
        { role: "user", content: userPrompt(words) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "passage",
          strict: true,
          schema: {
            type: "object",
            properties: { title: { type: "string" }, passage: { type: "string" } },
            required: ["title", "passage"],
            additionalProperties: false,
          },
        },
      },
    }),
  });
  if (!res.ok) {
    throw new PassageError(`OpenAI API がエラーを返しました（${res.status}）: ${await res.text()}`);
  }
  const completion = CompletionSchema.parse(await res.json());
  return PassageSchema.parse(JSON.parse(completion.choices[0].message.content));
};

export const generatePassage = async (
  env: unknown,
  words: TargetWord[],
): Promise<GeneratedPassage> => {
  const config = OpenAIEnvSchema.safeParse(env);
  if (!config.success) {
    throw new PassageError("OPENAI_API_KEY（secret）と WORKER_OPENAI_MODEL を設定してください");
  }
  const { OPENAI_API_KEY: apiKey, OPENAI_MODEL: model } = config.data;
  let result = await requestPassage(apiKey, model, words);
  if (usedWordNumbers(result.passage).size < words.length) {
    result = await requestPassage(apiKey, model, words);
  }
  return { title: result.title, body: result.passage, model };
};
