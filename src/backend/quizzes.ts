import { shuffle } from "remeda";
import { z } from "zod/mini";
import { type CardFilter, isFavorite } from "./db";
import { CardFilterSchema, coercedInt, coercedLiteral } from "./paging";

export const QuizQuestionCounts = [10, 20, 30, 50] as const;
export const DefaultQuizQuestionCount = 10;

export const QuizRequestSchema = z.object({
  count: coercedLiteral(QuizQuestionCounts, DefaultQuizQuestionCount),
  only: CardFilterSchema,
});

export const AnswerSchema = z.object({
  choice: coercedInt(0, 3),
  number: coercedInt(1),
});

export const QuestionIdsSchema = z.catch(
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

export const StringsSchema = z.array(z.string());

export type QuizKind = "sentence" | "meaning";

export type QuestionHistory = { attempts: number; corrects: number; recent: boolean[] };

const RecentResultCount = 10;

export const questionsWithStats = (kind: QuizKind) => `questions q
         JOIN words w ON w.id = q.word_id
         LEFT JOIN question_stats s ON s.question_id = q.id AND s.kind = '${kind}'`;

export const historyColumns = (kind: QuizKind) => `COALESCE(s.attempts, 0) AS attempts,
       COALESCE(s.corrects, 0) AS corrects,
       (SELECT group_concat(correct, '')
          FROM (SELECT correct
                  FROM (SELECT a.id, a.correct FROM question_answers a
                         WHERE a.question_id = q.id AND a.kind = '${kind}'
                         ORDER BY a.id DESC LIMIT ${RecentResultCount})
                 ORDER BY id)) AS recent`;

export type HistoryRow = { attempts: number; corrects: number; recent: string | null };

export const toHistory = ({ attempts, corrects, recent }: HistoryRow): QuestionHistory => ({
  attempts,
  corrects,
  recent: [...(recent ?? "")].map((c) => c === "1"),
});

export type QuizQuestion = {
  id: number;
  number: number;
  sentence: string;
  choices: string[];
  answer: number;
  choice_meanings: string[];
  translation: string;
  explanation: string;
  chosen: number | null;
  history: QuestionHistory;
  word_id: number;
  term: string;
  meaning: string;
  audio_key: string | null;
  favorite: boolean;
};

type QuestionRow = Omit<
  QuizQuestion,
  "number" | "choices" | "choice_meanings" | "chosen" | "history" | "favorite"
> &
  HistoryRow & {
    choices: string;
    choice_meanings: string;
    favorite: number;
  };

const QuestionColumns = `q.id, q.sentence, q.choices, q.answer, q.choice_meanings,
       q.translation, q.explanation, w.id AS word_id, w.term, w.meaning, w.audio_key,
       ${historyColumns("sentence")},
       ${isFavorite("w.id")} AS favorite`;

const toQuestion = (
  { attempts, corrects, recent, favorite, ...row }: QuestionRow,
  number: number,
  chosen: number | null,
): QuizQuestion => ({
  ...row,
  number,
  chosen,
  history: toHistory({ attempts, corrects, recent }),
  choices: StringsSchema.parse(JSON.parse(row.choices)),
  choice_meanings: StringsSchema.parse(JSON.parse(row.choice_meanings)),
  favorite: favorite === 1,
});

export const pickQuestionIds = async (
  db: D1Database,
  groupId: number,
  count: number,
  filter: CardFilter,
  kind: QuizKind,
) => {
  const { results } = await db
    .prepare(
      `SELECT q.id
         FROM group_words gw
         JOIN questions q ON q.word_id = gw.word_id
         LEFT JOIN question_stats s ON s.question_id = q.id AND s.kind = '${kind}'
        WHERE gw.group_id = ? ${filter === "favorites" ? `AND ${isFavorite("gw.word_id")}` : ""}
        ORDER BY COALESCE(s.latest_correct, 0), RANDOM()
        LIMIT ?`,
    )
    .bind(groupId, count)
    .all<{ id: number }>();
  return shuffle(results.map((q) => q.id));
};

export const recordAnswer = async (
  db: D1Database,
  kind: QuizKind,
  questionId: number,
  choice: number,
) => {
  await db
    .prepare(
      `INSERT INTO question_answers (question_id, kind, chosen, correct)
       SELECT id, ?, ?, answer = ? FROM questions WHERE id = ?`,
    )
    .bind(kind, choice, choice, questionId)
    .run();
};

export const getQuestions = async (db: D1Database, ids: number[]): Promise<QuizQuestion[]> => {
  if (ids.length === 0) return [];
  const { results } = await db
    .prepare(
      `SELECT ${QuestionColumns}
         FROM ${questionsWithStats("sentence")}
        WHERE q.id IN (${ids.map(() => "?").join(", ")})`,
    )
    .bind(...ids)
    .all<QuestionRow>();
  const rows = new Map(results.map((row) => [row.id, row]));
  return ids.flatMap((id, i) => {
    const row = rows.get(id);
    return row ? [toQuestion(row, i + 1, null)] : [];
  });
};

export const answerQuestion = async (
  db: D1Database,
  questionId: number,
  number: number,
  choice: number,
): Promise<QuizQuestion | null> => {
  await recordAnswer(db, "sentence", questionId, choice);
  const row = await db
    .prepare(
      `SELECT ${QuestionColumns}
         FROM ${questionsWithStats("sentence")}
        WHERE q.id = ?`,
    )
    .bind(questionId)
    .first<QuestionRow>();
  return row ? toQuestion(row, number, choice) : null;
};
