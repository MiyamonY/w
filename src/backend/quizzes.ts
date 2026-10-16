import { z } from "zod/mini";
import { type CardFilter, IsFavorite } from "./db";
import { CardFilterSchema, coercedInt, coercedLiteral } from "./paging";

export const QuizQuestionCounts = [10, 20, 30, 50] as const;
export const DefaultQuizQuestionCount = 10;

export const QuizRequestSchema = z.object({
  count: coercedLiteral(QuizQuestionCounts, DefaultQuizQuestionCount),
  only: CardFilterSchema,
});

export const ChoiceSchema = coercedInt(0, 3);

const StringsSchema = z.array(z.string());

export type QuizSummary = {
  id: number;
  created_at: string;
  question_count: number;
  answered_count: number;
  correct_count: number;
};

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
  word_id: number;
  term: string;
  meaning: string;
  audio_key: string | null;
  favorite: boolean;
};

export type Quiz = {
  id: number;
  group_id: number;
  group_name: string;
  created_at: string;
  questions: QuizQuestion[];
};

export type QuizScore = { total: number; answered: number; correct: number };

type QuizQuestionRow = Omit<QuizQuestion, "choices" | "choice_meanings" | "favorite"> & {
  choices: string;
  choice_meanings: string;
  favorite: number;
};

const QuestionColumns = `q.id, qq.number, q.sentence, q.choices, q.answer, q.choice_meanings,
       q.translation, q.explanation, qq.chosen, w.id AS word_id, w.term, w.meaning, w.audio_key,
       ${IsFavorite} AS favorite`;

const toQuestion = (row: QuizQuestionRow): QuizQuestion => ({
  ...row,
  choices: StringsSchema.parse(JSON.parse(row.choices)),
  choice_meanings: StringsSchema.parse(JSON.parse(row.choice_meanings)),
  favorite: row.favorite === 1,
});

export const countGroupQuestions = async (db: D1Database, groupId: number) =>
  (await db
    .prepare(
      `SELECT COUNT(*) AS n FROM group_words gw JOIN questions q ON q.word_id = gw.word_id
        WHERE gw.group_id = ?`,
    )
    .bind(groupId)
    .first<number>("n")) ?? 0;

export const createQuiz = async (
  db: D1Database,
  groupId: number,
  count: number,
  filter: CardFilter,
): Promise<number | null> => {
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
  if (results.length === 0) return null;
  const quiz = await db
    .prepare(`INSERT INTO quizzes (group_id) VALUES (?) RETURNING id`)
    .bind(groupId)
    .first<{ id: number }>();
  if (!quiz) throw new Error("quizzes への保存に失敗しました");
  await db.batch(
    results.map((q, i) =>
      db
        .prepare(`INSERT INTO quiz_questions (quiz_id, question_id, number) VALUES (?, ?, ?)`)
        .bind(quiz.id, q.id, i + 1),
    ),
  );
  return quiz.id;
};

export const listQuizzes = async (db: D1Database, groupId: number): Promise<QuizSummary[]> => {
  const { results } = await db
    .prepare(
      `SELECT z.id, z.created_at,
              COUNT(*) AS question_count,
              COUNT(qq.chosen) AS answered_count,
              COALESCE(SUM(qq.chosen = q.answer), 0) AS correct_count
         FROM quizzes z
         JOIN quiz_questions qq ON qq.quiz_id = z.id
         JOIN questions q ON q.id = qq.question_id
        WHERE z.group_id = ?
        GROUP BY z.id
        ORDER BY z.id DESC
        LIMIT 50`,
    )
    .bind(groupId)
    .all<QuizSummary>();
  return results;
};

export const getQuiz = async (db: D1Database, id: number): Promise<Quiz | null> => {
  const quiz = await db
    .prepare(
      `SELECT z.id, z.group_id, g.name AS group_name, z.created_at
         FROM quizzes z JOIN word_groups g ON g.id = z.group_id
        WHERE z.id = ?`,
    )
    .bind(id)
    .first<Omit<Quiz, "questions">>();
  if (!quiz) return null;
  const { results } = await db
    .prepare(
      `SELECT ${QuestionColumns}
         FROM quiz_questions qq
         JOIN questions q ON q.id = qq.question_id
         JOIN words w ON w.id = q.word_id
        WHERE qq.quiz_id = ?
        ORDER BY qq.number`,
    )
    .bind(id)
    .all<QuizQuestionRow>();
  return { ...quiz, questions: results.map(toQuestion) };
};

export const answerQuestion = async (
  db: D1Database,
  quizId: number,
  questionId: number,
  choice: number,
): Promise<{ question: QuizQuestion; score: QuizScore } | null> => {
  await db
    .prepare(
      `UPDATE quiz_questions SET chosen = ?
        WHERE quiz_id = ? AND question_id = ? AND chosen IS NULL`,
    )
    .bind(choice, quizId, questionId)
    .run();
  const row = await db
    .prepare(
      `SELECT ${QuestionColumns}
         FROM quiz_questions qq
         JOIN questions q ON q.id = qq.question_id
         JOIN words w ON w.id = q.word_id
        WHERE qq.quiz_id = ? AND qq.question_id = ?`,
    )
    .bind(quizId, questionId)
    .first<QuizQuestionRow>();
  if (!row) return null;
  return { question: toQuestion(row), score: await getScore(db, quizId) };
};

export const getScore = async (db: D1Database, quizId: number): Promise<QuizScore> => {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total, COUNT(qq.chosen) AS answered,
              COALESCE(SUM(qq.chosen = q.answer), 0) AS correct
         FROM quiz_questions qq JOIN questions q ON q.id = qq.question_id
        WHERE qq.quiz_id = ?`,
    )
    .bind(quizId)
    .first<QuizScore>();
  return row ?? { total: 0, answered: 0, correct: 0 };
};

export const scoreOf = (questions: QuizQuestion[]): QuizScore => ({
  total: questions.length,
  answered: questions.filter((q) => q.chosen !== null).length,
  correct: questions.filter((q) => q.chosen === q.answer).length,
});
