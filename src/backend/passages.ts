import { z } from "zod/mini";
import { type CardFilter, isFavorite } from "./db";
import { CardFilterSchema, coercedLiteral } from "./paging";

const Marker = /\{\{(\d+)\|([^{}]+)\}\}/g;

export type PassageSegment = { text: string } | { number: number; form: string };

export const parsePassageBody = (body: string): PassageSegment[][] =>
  body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => {
      const segments: PassageSegment[] = [];
      let last = 0;
      for (const match of paragraph.matchAll(Marker)) {
        if (match.index > last) segments.push({ text: paragraph.slice(last, match.index) });
        segments.push({ number: Number(match[1]), form: match[2] });
        last = match.index + match[0].length;
      }
      if (last < paragraph.length) segments.push({ text: paragraph.slice(last) });
      return segments;
    });

export const usedWordNumbers = (body: string) =>
  new Set([...body.matchAll(Marker)].map((match) => Number(match[1])));

export const TestWordCounts = [5, 10, 15, 20] as const;
export const DefaultTestWordCount = 10;

export const TestRequestSchema = z.object({
  count: coercedLiteral(TestWordCounts, DefaultTestWordCount),
  only: CardFilterSchema,
});

export type PassageSummary = {
  id: number;
  title: string;
  created_at: string;
  word_count: number;
  revealed_count: number;
};

export type PassageWord = {
  id: number;
  number: number;
  term: string;
  ipa: string | null;
  meaning: string;
  audio_key: string | null;
  favorite: boolean;
  revealed: boolean;
};

export type Passage = {
  id: number;
  group_id: number;
  group_name: string;
  title: string;
  body: string;
  created_at: string;
  words: PassageWord[];
};

export const pickTestWords = async (
  db: D1Database,
  groupId: number,
  count: number,
  filter: CardFilter,
) => {
  const { results } = await db
    .prepare(
      `SELECT w.id, w.term, w.meaning
         FROM group_words gw
         JOIN words w ON w.id = gw.word_id
        WHERE gw.group_id = ? ${filter === "favorites" ? `AND ${isFavorite("w.id")}` : ""}
        ORDER BY RANDOM()
        LIMIT ?`,
    )
    .bind(groupId, count)
    .all<{ id: number; term: string; meaning: string }>();
  return results;
};

export const createPassage = async (
  db: D1Database,
  passage: { groupId: number; title: string; body: string; model: string; wordIds: number[] },
): Promise<number> => {
  const row = await db
    .prepare(`INSERT INTO passages (group_id, title, body, model) VALUES (?, ?, ?, ?) RETURNING id`)
    .bind(passage.groupId, passage.title, passage.body, passage.model)
    .first<{ id: number }>();
  if (!row) throw new Error("passages への保存に失敗しました");
  await db.batch(
    passage.wordIds.map((wordId, i) =>
      db
        .prepare(`INSERT INTO passage_words (passage_id, word_id, number) VALUES (?, ?, ?)`)
        .bind(row.id, wordId, i + 1),
    ),
  );
  return row.id;
};

export const listPassages = async (db: D1Database, groupId: number): Promise<PassageSummary[]> => {
  const { results } = await db
    .prepare(
      `SELECT p.id, p.title, p.created_at,
              COUNT(pw.word_id) AS word_count, COALESCE(SUM(pw.revealed), 0) AS revealed_count
         FROM passages p
         LEFT JOIN passage_words pw ON pw.passage_id = p.id
        WHERE p.group_id = ?
        GROUP BY p.id
        ORDER BY p.id DESC
        LIMIT 50`,
    )
    .bind(groupId)
    .all<PassageSummary>();
  return results;
};

type PassageWordRow = Omit<PassageWord, "favorite" | "revealed"> & {
  favorite: number;
  revealed: number;
};

export const getPassage = async (db: D1Database, id: number): Promise<Passage | null> => {
  const passage = await db
    .prepare(
      `SELECT p.id, p.group_id, g.name AS group_name, p.title, p.body, p.created_at
         FROM passages p JOIN word_groups g ON g.id = p.group_id
        WHERE p.id = ?`,
    )
    .bind(id)
    .first<Omit<Passage, "words">>();
  if (!passage) return null;
  const { results } = await db
    .prepare(
      `SELECT w.id, pw.number, w.term, w.ipa, w.meaning, w.audio_key, pw.revealed,
              ${isFavorite("w.id")} AS favorite
         FROM passage_words pw JOIN words w ON w.id = pw.word_id
        WHERE pw.passage_id = ?
        ORDER BY pw.number`,
    )
    .bind(id)
    .all<PassageWordRow>();
  return {
    ...passage,
    words: results.map((w) => ({ ...w, favorite: w.favorite === 1, revealed: w.revealed === 1 })),
  };
};

export const markRevealed = async (db: D1Database, passageId: number, wordId: number) => {
  await db
    .prepare(`UPDATE passage_words SET revealed = 1 WHERE passage_id = ? AND word_id = ?`)
    .bind(passageId, wordId)
    .run();
};
