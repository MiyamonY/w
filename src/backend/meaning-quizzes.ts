import { isFavorite } from "./db";
import {
  ChoicesSchema,
  inList,
  orderByIds,
  type QuestionHistory,
  type QuizChoice,
  recordAnswer,
  StatsColumns,
  type StatsRow,
  statsJoin,
  toHistory,
} from "./quizzes";

export type MeaningQuestion = {
  word_id: number;
  number: number;
  term: string;
  ipa: string | null;
  audio_key: string | null;
  favorite: boolean;
  choices: QuizChoice[];
  answer: number;
  chosen: number | null;
  history: QuestionHistory;
};

type MeaningQuestionRow = Omit<
  MeaningQuestion,
  "number" | "choices" | "chosen" | "history" | "favorite"
> &
  StatsRow & { choices: string; favorite: number };

const MeaningQuestionColumns = `w.id AS word_id, w.term, w.ipa, w.audio_key, wc.choices, wc.answer,
       ${StatsColumns},
       ${isFavorite("w.id")} AS favorite`;

const MeaningQuestionTables = `word_choices wc
         JOIN words w ON w.id = wc.word_id
         ${statsJoin("meaning")}`;

const toMeaningQuestion = (
  { attempts, corrects, recent, favorite, ...row }: MeaningQuestionRow,
  number: number,
  chosen: number | null,
): MeaningQuestion => ({
  ...row,
  number,
  chosen,
  history: toHistory({ attempts, corrects, recent }),
  choices: ChoicesSchema.parse(JSON.parse(row.choices)),
  favorite: favorite === 1,
});

export const getMeaningQuestions = async (
  db: D1Database,
  ids: number[],
): Promise<MeaningQuestion[]> => {
  if (ids.length === 0) return [];
  const { results } = await db
    .prepare(
      `SELECT ${MeaningQuestionColumns} FROM ${MeaningQuestionTables}
        WHERE wc.word_id IN (${inList(ids)})`,
    )
    .bind(...ids)
    .all<MeaningQuestionRow>();
  return orderByIds(ids, results).map(({ row, number }) => toMeaningQuestion(row, number, null));
};

export const answerMeaningQuestion = async (
  db: D1Database,
  wordId: number,
  number: number,
  choice: number,
): Promise<MeaningQuestion | null> => {
  await recordAnswer(db, "meaning", wordId, choice);
  const row = await db
    .prepare(`SELECT ${MeaningQuestionColumns} FROM ${MeaningQuestionTables} WHERE wc.word_id = ?`)
    .bind(wordId)
    .first<MeaningQuestionRow>();
  return row ? toMeaningQuestion(row, number, choice) : null;
};
