export type Group = {
  id: number;
  name: string;
  description: string | null;
  word_count: number;
  favorite_count: number;
};

export type Example = {
  sentence: string;
  translation: string | null;
  audio_key: string | null;
  source_title: string | null;
  source_url: string | null;
};

export type SourceNumber = {
  number: number;
  source_title: string;
};

export type Word = {
  id: number;
  term: string;
  ipa: string | null;
  meaning: string;
  audio_key: string | null;
  image_key: string | null;
  examples: Example[];
  numbers: SourceNumber[];
  favorite: boolean;
};

export type GroupRef = { id: number; name: string };
export type WordWithGroups = Word & { groups: GroupRef[] };

const GroupColumns = `id, name, description, word_count, favorite_count`;

export const listGroups = async (db: D1Database): Promise<Group[]> => {
  const { results } = await db
    .prepare(
      `SELECT ${GroupColumns}
         FROM word_groups
        ORDER BY sort_order, id`,
    )
    .all<Group>();
  return results;
};

export const getGroup = async (db: D1Database, id: number): Promise<Group | null> => {
  return db.prepare(`SELECT ${GroupColumns} FROM word_groups WHERE id = ?`).bind(id).first<Group>();
};

export const countWords = async (db: D1Database, filter: CardFilter = "all"): Promise<number> => {
  const column = filter === "favorites" ? "favorite_count" : "count";
  return (
    (await db.prepare(`SELECT ${column} FROM word_totals WHERE id = 1`).first<number>(column)) ?? 0
  );
};

const SourcesJson = `
  (SELECT json_group_array(json_object(
            'number', number, 'examples', json(examples), 'title', title, 'url', url))
     FROM (SELECT ws.number, ws.examples, s.title, s.url
             FROM word_sources ws
             JOIN sources s ON s.id = ws.source_id
            WHERE ws.word_id = w.id
            ORDER BY ws.source_id)) AS sources_json`;

const GroupsJson = `
  (SELECT json_group_array(json_object('id', id, 'name', name))
     FROM (SELECT g.id, g.name
             FROM group_words x
             JOIN word_groups g ON g.id = x.group_id
            WHERE x.word_id = w.id
            ORDER BY g.sort_order, g.id)) AS groups_json`;

// 件数の少ないお気に入り側（idx_words_favorite）から読むよう、CROSS JOIN で結合順を固定する
const GroupFavoriteIds = `
  SELECT gw.word_id, gw.sort_order
    FROM words fw
   CROSS JOIN group_words gw ON gw.group_id = ? AND gw.word_id = fw.id
   WHERE fw.favorite = 1`;

const GroupWordIds = `SELECT word_id, sort_order FROM group_words WHERE group_id = ?`;

const WordColumns = `w.id, w.term, w.ipa, w.meaning, w.audio_key, w.image_key, ${SourcesJson}, w.favorite`;

type WordRow = Omit<Word, "examples" | "numbers" | "favorite"> & {
  sources_json: string;
  favorite: number;
};

type WordSource = {
  number: number;
  examples: Pick<Example, "sentence" | "translation" | "audio_key">[];
  title: string;
  url: string | null;
};
type WordWithGroupsRow = WordRow & { groups_json: string };

const toWord = ({ sources_json, favorite, ...w }: WordRow): Word => {
  const sources = JSON.parse(sources_json) as WordSource[];
  return {
    ...w,
    examples: sources.flatMap((s) =>
      s.examples.map((e) => ({ ...e, source_title: s.title, source_url: s.url })),
    ),
    numbers: sources.map((s) => ({ number: s.number, source_title: s.title })),
    favorite: favorite === 1,
  };
};

const toWordWithGroups = ({ groups_json, ...row }: WordWithGroupsRow): WordWithGroups => ({
  ...toWord(row),
  groups: JSON.parse(groups_json) as GroupRef[],
});

export type CardFilter = "all" | "favorites";

export const listCardWordIds = async (
  db: D1Database,
  groupId: number,
  filter: CardFilter,
): Promise<number[]> => {
  const { results } = await db
    .prepare(
      `SELECT word_id FROM (${filter === "favorites" ? GroupFavoriteIds : GroupWordIds})
        ORDER BY sort_order, word_id`,
    )
    .bind(groupId)
    .all<{ word_id: number }>();
  return results.map((row) => row.word_id);
};

export const getWord = async (db: D1Database, wordId: number): Promise<Word | null> => {
  const row = await db
    .prepare(`SELECT ${WordColumns} FROM words w WHERE w.id = ?`)
    .bind(wordId)
    .first<WordRow>();
  return row && toWord(row);
};

export const listGroupWords = async (
  db: D1Database,
  groupId: number,
  range: { limit: number; offset: number },
  filter: CardFilter = "all",
): Promise<WordWithGroups[]> => {
  const { results } = await db
    .prepare(
      `SELECT ${WordColumns}, ${GroupsJson}
         FROM (SELECT word_id, sort_order
                 FROM (${filter === "favorites" ? GroupFavoriteIds : GroupWordIds})
                ORDER BY sort_order, word_id LIMIT ? OFFSET ?) page
         JOIN words w ON w.id = page.word_id
        ORDER BY page.sort_order, page.word_id`,
    )
    .bind(groupId, range.limit, range.offset)
    .all<WordWithGroupsRow>();
  return results.map(toWordWithGroups);
};

export const listAllWords = async (
  db: D1Database,
  range: { limit: number; offset: number },
  filter: CardFilter = "all",
): Promise<WordWithGroups[]> => {
  const { results } = await db
    .prepare(
      `SELECT ${WordColumns}, ${GroupsJson}
         FROM (SELECT id FROM words ${filter === "favorites" ? "WHERE favorite = 1" : ""}
                ORDER BY id LIMIT ? OFFSET ?) page
         JOIN words w ON w.id = page.id
        ORDER BY w.id`,
    )
    .bind(range.limit, range.offset)
    .all<WordWithGroupsRow>();
  return results.map(toWordWithGroups);
};

export const toggleFavorite = async (db: D1Database, wordId: number): Promise<boolean> =>
  (await db
    .prepare(`UPDATE words SET favorite = 1 - favorite WHERE id = ? RETURNING favorite`)
    .bind(wordId)
    .first<number>("favorite")) === 1;
