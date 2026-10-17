import { shuffle } from "remeda";
import { type CardFilter, isFavorite } from "./db";
import { type QuestionHistory, RecentResultCount, StringsSchema } from "./quizzes";

export type MeaningQuestion = {
  id: number;
  number: number;
  word_id: number;
  term: string;
  ipa: string | null;
  audio_key: string | null;
  favorite: boolean;
  choices: string[];
  choice_terms: string[];
  answer: number;
  chosen: number | null;
  history: QuestionHistory;
};

type MeaningQuestionRow = Omit<
  MeaningQuestion,
  "number" | "choices" | "choice_terms" | "chosen" | "history" | "favorite"
> & {
  choices: string;
  choice_terms: string;
  attempts: number;
  corrects: number;
  recent: string | null;
  favorite: number;
};

const MeaningQuestionColumns = `q.id, q.answer, q.choice_meanings AS choices, q.choices AS choice_terms,
       w.id AS word_id, w.term, w.ipa, w.audio_key,
       q.meaning_attempts AS attempts, q.meaning_corrects AS corrects,
       (SELECT group_concat(correct, '')
          FROM (SELECT correct
                  FROM (SELECT a.id, a.correct FROM meaning_answers a
                         WHERE a.question_id = q.id ORDER BY a.id DESC LIMIT ${RecentResultCount})
                 ORDER BY id)) AS recent,
       ${isFavorite("w.id")} AS favorite`;

const toMeaningQuestion = (
  { attempts, corrects, recent, favorite, ...row }: MeaningQuestionRow,
  number: number,
  chosen: number | null,
): MeaningQuestion => ({
  ...row,
  number,
  chosen,
  history: { attempts, corrects, recent: [...(recent ?? "")].map((c) => c === "1") },
  choices: StringsSchema.parse(JSON.parse(row.choices)),
  choice_terms: StringsSchema.parse(JSON.parse(row.choice_terms)),
  favorite: favorite === 1,
});

export const pickMeaningQuestionIds = async (
  db: D1Database,
  groupId: number,
  count: number,
  filter: CardFilter,
) => {
  const { results } = await db
    .prepare(
      `SELECT q.id
         FROM group_words gw
         JOIN questions q ON q.word_id = gw.word_id
        WHERE gw.group_id = ? ${filter === "favorites" ? `AND ${isFavorite("gw.word_id")}` : ""}
        ORDER BY COALESCE(q.meaning_latest_correct, 0), RANDOM()
        LIMIT ?`,
    )
    .bind(groupId, count)
    .all<{ id: number }>();
  return shuffle(results.map((q) => q.id));
};

export const getMeaningQuestions = async (
  db: D1Database,
  ids: number[],
): Promise<MeaningQuestion[]> => {
  if (ids.length === 0) return [];
  const { results } = await db
    .prepare(
      `SELECT ${MeaningQuestionColumns}
         FROM questions q JOIN words w ON w.id = q.word_id
        WHERE q.id IN (${ids.map(() => "?").join(", ")})`,
    )
    .bind(...ids)
    .all<MeaningQuestionRow>();
  const rows = new Map(results.map((row) => [row.id, row]));
  return ids.flatMap((id, i) => {
    const row = rows.get(id);
    return row ? [toMeaningQuestion(row, i + 1, null)] : [];
  });
};

export const answerMeaningQuestion = async (
  db: D1Database,
  questionId: number,
  number: number,
  choice: number,
): Promise<MeaningQuestion | null> => {
  await db
    .prepare(
      `INSERT INTO meaning_answers (question_id, chosen, correct)
       SELECT id, ?, answer = ? FROM questions WHERE id = ?`,
    )
    .bind(choice, choice, questionId)
    .run();
  const row = await db
    .prepare(
      `SELECT ${MeaningQuestionColumns}
         FROM questions q JOIN words w ON w.id = q.word_id
        WHERE q.id = ?`,
    )
    .bind(questionId)
    .first<MeaningQuestionRow>();
  return row ? toMeaningQuestion(row, number, choice) : null;
};
