import { z } from "zod/mini";
import { type CardFilter, IsFavorite } from "./db";
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

const StringsSchema = z.array(z.string());

export type QuestionHistory = { attempts: number; corrects: number };

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

export type GroupQuizStats = { questions: number; answered: number; latest_correct: number };

type QuestionRow = Omit<
  QuizQuestion,
  "number" | "choices" | "choice_meanings" | "chosen" | "history" | "favorite"
> & {
  choices: string;
  choice_meanings: string;
  attempts: number;
  corrects: number;
  favorite: number;
};

const QuestionColumns = `q.id, q.sentence, q.choices, q.answer, q.choice_meanings,
       q.translation, q.explanation, w.id AS word_id, w.term, w.meaning, w.audio_key,
       (SELECT COUNT(*) FROM question_answers a WHERE a.question_id = q.id) AS attempts,
       (SELECT COUNT(*) FROM question_answers a WHERE a.question_id = q.id AND a.correct = 1) AS corrects,
       ${IsFavorite} AS favorite`;

const toQuestion = (
  { attempts, corrects, favorite, ...row }: QuestionRow,
  number: number,
  chosen: number | null,
): QuizQuestion => ({
  ...row,
  number,
  chosen,
  history: { attempts, corrects },
  choices: StringsSchema.parse(JSON.parse(row.choices)),
  choice_meanings: StringsSchema.parse(JSON.parse(row.choice_meanings)),
  favorite: favorite === 1,
});

export const getGroupQuizStats = async (db: D1Database, groupId: number) =>
  (await db
    .prepare(
      `SELECT COUNT(*) AS questions,
              COUNT(latest.correct) AS answered,
              COALESCE(SUM(latest.correct), 0) AS latest_correct
         FROM group_words gw
         JOIN questions q ON q.word_id = gw.word_id
         LEFT JOIN question_answers latest ON latest.id =
              (SELECT MAX(a.id) FROM question_answers a WHERE a.question_id = q.id)
        WHERE gw.group_id = ?`,
    )
    .bind(groupId)
    .first<GroupQuizStats>()) ?? { questions: 0, answered: 0, latest_correct: 0 };

export const pickQuestionIds = async (
  db: D1Database,
  groupId: number,
  count: number,
  filter: CardFilter,
) => {
  const { results } = await db
    .prepare(
      `SELECT q.id
         FROM group_words gw
         JOIN words w ON w.id = gw.word_id
         JOIN questions q ON q.word_id = w.id
        WHERE gw.group_id = ? ${filter === "favorites" ? `AND ${IsFavorite}` : ""}
        ORDER BY RANDOM()
        LIMIT ?`,
    )
    .bind(groupId, count)
    .all<{ id: number }>();
  return results.map((q) => q.id);
};

export const getQuestions = async (db: D1Database, ids: number[]): Promise<QuizQuestion[]> => {
  if (ids.length === 0) return [];
  const { results } = await db
    .prepare(
      `SELECT ${QuestionColumns}
         FROM questions q JOIN words w ON w.id = q.word_id
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
  await db
    .prepare(
      `INSERT INTO question_answers (question_id, chosen, correct)
       SELECT id, ?, answer = ? FROM questions WHERE id = ?`,
    )
    .bind(choice, choice, questionId)
    .run();
  const row = await db
    .prepare(
      `SELECT ${QuestionColumns}
         FROM questions q JOIN words w ON w.id = q.word_id
        WHERE q.id = ?`,
    )
    .bind(questionId)
    .first<QuestionRow>();
  return row ? toQuestion(row, number, choice) : null;
};
