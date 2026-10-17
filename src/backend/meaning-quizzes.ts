import { isFavorite } from "./db";
import {
  type HistoryRow,
  historyColumns,
  type QuestionHistory,
  questionsWithStats,
  recordAnswer,
  StringsSchema,
  toHistory,
} from "./quizzes";

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
> &
  HistoryRow & {
    choices: string;
    choice_terms: string;
    favorite: number;
  };

const MeaningQuestionColumns = `q.id, q.answer, q.choice_meanings AS choices, q.choices AS choice_terms,
       w.id AS word_id, w.term, w.ipa, w.audio_key,
       ${historyColumns("meaning")},
       ${isFavorite("w.id")} AS favorite`;

const toMeaningQuestion = (
  { attempts, corrects, recent, favorite, ...row }: MeaningQuestionRow,
  number: number,
  chosen: number | null,
): MeaningQuestion => ({
  ...row,
  number,
  chosen,
  history: toHistory({ attempts, corrects, recent }),
  choices: StringsSchema.parse(JSON.parse(row.choices)),
  choice_terms: StringsSchema.parse(JSON.parse(row.choice_terms)),
  favorite: favorite === 1,
});

export const getMeaningQuestions = async (
  db: D1Database,
  ids: number[],
): Promise<MeaningQuestion[]> => {
  if (ids.length === 0) return [];
  const { results } = await db
    .prepare(
      `SELECT ${MeaningQuestionColumns}
         FROM ${questionsWithStats("meaning")}
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
  await recordAnswer(db, "meaning", questionId, choice);
  const row = await db
    .prepare(
      `SELECT ${MeaningQuestionColumns}
         FROM ${questionsWithStats("meaning")}
        WHERE q.id = ?`,
    )
    .bind(questionId)
    .first<MeaningQuestionRow>();
  return row ? toMeaningQuestion(row, number, choice) : null;
};
