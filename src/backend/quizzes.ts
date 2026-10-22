import { shuffle } from "remeda";
import { z } from "zod/mini";
import type { CardFilter } from "./db";
import { CardFilterSchema, coercedInt, coercedLiteral } from "./paging";

export const QuizQuestionCounts = [10, 20, 30, 50] as const;
export const DefaultQuizQuestionCount = 20;

export const QuizRequestSchema = z.object({
  count: coercedLiteral(QuizQuestionCounts, DefaultQuizQuestionCount),
  only: CardFilterSchema,
});

export const AnswerSchema = z.object({
  choice: coercedInt(0, 3),
  number: coercedInt(1),
});

export const WordIdsSchema = z.catch(
  z.pipe(
    z.string(),
    z.transform((value) =>
      value
        .split(",")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ),
  [],
);

export type QuizKind = "cloze" | "meaning";

export type QuizChoice = { en: string; ja: string };

export const ChoicesSchema = z.array(z.object({ en: z.string(), ja: z.string() }));

export type QuestionHistory = { attempts: number; corrects: number; recent: boolean[] };

const RecentResultCount = 10;

export const statsJoin = (kind: QuizKind) =>
  `LEFT JOIN quiz_stats s ON s.word_id = w.id AND s.kind = '${kind}'`;

export const StatsColumns = `COALESCE(s.attempts, 0) AS attempts, COALESCE(s.corrects, 0) AS corrects,
       COALESCE(s.recent, '[]') AS recent`;

export type StatsRow = { attempts: number; corrects: number; recent: string };

const RecentSchema = z.array(z.number());

export const toHistory = ({ attempts, corrects, recent }: StatsRow): QuestionHistory => ({
  attempts,
  corrects,
  recent: RecentSchema.parse(JSON.parse(recent)).map((c) => c === 1),
});

export const pickQuizWordIds = async (
  db: D1Database,
  groupId: number,
  count: number,
  filter: CardFilter,
  kind: QuizKind,
) => {
  const { results } = await db
    .prepare(
      `SELECT gw.word_id
         FROM ${
           filter === "favorites"
             ? "words fw CROSS JOIN group_words gw ON gw.group_id = ? AND gw.word_id = fw.id"
             : "group_words gw"
         }
         LEFT JOIN quiz_stats s ON s.word_id = gw.word_id AND s.kind = '${kind}'
        WHERE ${filter === "favorites" ? "fw.favorite = 1" : "gw.group_id = ?"}
        ORDER BY COALESCE(json_extract(s.recent, '$[#-1]'), 0), RANDOM()
        LIMIT ?`,
    )
    .bind(groupId, count)
    .all<{ word_id: number }>();
  return shuffle(results.map((row) => row.word_id));
};

export const recordAnswer = async (
  db: D1Database,
  kind: QuizKind,
  wordId: number,
  choice: number,
) => {
  await db
    .prepare(
      `INSERT INTO quiz_stats (word_id, kind, attempts, corrects, recent)
       SELECT word_id, ?1, 1, answer = ?2, json_array(answer = ?2)
         FROM word_choices WHERE word_id = ?3
       ON CONFLICT (word_id, kind) DO UPDATE
          SET attempts = attempts + 1,
              corrects = corrects + excluded.corrects,
              recent = (SELECT json_group_array(value)
                          FROM json_each(json_insert(quiz_stats.recent, '$[#]', excluded.corrects))
                         WHERE key > json_array_length(quiz_stats.recent) - ${RecentResultCount})`,
    )
    .bind(kind, choice, wordId)
    .run();
};

export const inList = (ids: number[]) => ids.map(() => "?").join(", ");

export const orderByIds = <T extends { word_id: number }>(ids: number[], rows: T[]) => {
  const byId = new Map(rows.map((row) => [row.word_id, row]));
  return ids.flatMap((id, i) => {
    const row = byId.get(id);
    return row ? [{ row, number: i + 1 }] : [];
  });
};

export type QuizQuestion = {
  word_id: number;
  number: number;
  term: string;
  meaning: string;
  audio_key: string | null;
  favorite: boolean;
  sentence: string;
  choices: QuizChoice[];
  answer: number;
  translation: string;
  explanation: string;
  chosen: number | null;
  history: QuestionHistory;
};

type QuestionRow = Omit<QuizQuestion, "number" | "choices" | "chosen" | "history" | "favorite"> &
  StatsRow & { choices: string; favorite: number };

const QuestionColumns = `w.id AS word_id, w.term, w.meaning, w.audio_key,
       c.sentence, c.choices, wc.answer, c.translation, c.explanation,
       ${StatsColumns},
       w.favorite`;

const QuestionTables = `cloze_questions c
         JOIN word_choices wc ON wc.word_id = c.word_id
         JOIN words w ON w.id = c.word_id
         ${statsJoin("cloze")}`;

const toQuestion = (
  { attempts, corrects, recent, favorite, ...row }: QuestionRow,
  number: number,
  chosen: number | null,
): QuizQuestion => ({
  ...row,
  number,
  chosen,
  history: toHistory({ attempts, corrects, recent }),
  choices: ChoicesSchema.parse(JSON.parse(row.choices)),
  favorite: favorite === 1,
});

export const getQuestions = async (db: D1Database, ids: number[]): Promise<QuizQuestion[]> => {
  if (ids.length === 0) return [];
  const { results } = await db
    .prepare(`SELECT ${QuestionColumns} FROM ${QuestionTables} WHERE c.word_id IN (${inList(ids)})`)
    .bind(...ids)
    .all<QuestionRow>();
  return orderByIds(ids, results).map(({ row, number }) => toQuestion(row, number, null));
};

export const answerQuestion = async (
  db: D1Database,
  wordId: number,
  number: number,
  choice: number,
): Promise<QuizQuestion | null> => {
  await recordAnswer(db, "cloze", wordId, choice);
  const row = await db
    .prepare(`SELECT ${QuestionColumns} FROM ${QuestionTables} WHERE c.word_id = ?`)
    .bind(wordId)
    .first<QuestionRow>();
  return row ? toQuestion(row, number, choice) : null;
};
