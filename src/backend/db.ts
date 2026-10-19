export type Group = {
  id: number;
  name: string;
  description: string | null;
  word_count: number;
  favorite_count: number;
  kind: "normal" | "favorites";
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

const GroupColumns = `id, name, description, kind, word_count, favorite_count`;

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

export const countWords = async (db: D1Database): Promise<number> => {
  return (
    (await db.prepare(`SELECT count FROM word_totals WHERE id = 1`).first<number>("count")) ?? 0
  );
};

const ExamplesJson = `
  (SELECT json_group_array(json_object(
            'sentence', sentence, 'translation', translation, 'audio_key', audio_key,
            'source_title', source_title, 'source_url', source_url))
     FROM (SELECT e.sentence, e.translation, e.audio_key,
                  s.title AS source_title, s.url AS source_url
             FROM examples e
             LEFT JOIN sources s ON s.id = e.source_id
            WHERE e.word_id = w.id
            ORDER BY e.sort_order, e.id)) AS examples_json`;

const NumbersJson = `
  (SELECT json_group_array(json_object('number', number, 'source_title', source_title))
     FROM (SELECT sw.number, s.title AS source_title
             FROM source_words sw
             JOIN sources s ON s.id = sw.source_id
            WHERE sw.word_id = w.id
            ORDER BY s.id)) AS numbers_json`;

const GroupsJson = `
  (SELECT json_group_array(json_object('id', id, 'name', name))
     FROM (SELECT g.id, g.name
             FROM group_words x
             JOIN word_groups g ON g.id = x.group_id
            WHERE x.word_id = w.id
            ORDER BY g.sort_order, g.id)) AS groups_json`;

const FavoritesGroupId = `(SELECT id FROM word_groups WHERE kind = 'favorites')`;

// 件数の少ないお気に入り側から読むよう、CROSS JOIN で結合順を固定する
const GroupFavoriteIds = `
  SELECT gw.word_id, gw.sort_order
    FROM group_words f
   CROSS JOIN group_words gw ON gw.group_id = ? AND gw.word_id = f.word_id
   WHERE f.group_id = ${FavoritesGroupId}`;

const GroupWordIds = `SELECT word_id, sort_order FROM group_words WHERE group_id = ?`;

export const isFavorite = (wordId: string) => `
  EXISTS (SELECT 1 FROM group_words fx JOIN word_groups fg ON fg.id = fx.group_id
           WHERE fg.kind = 'favorites' AND fx.word_id = ${wordId})`;

const FavoriteColumn = `${isFavorite("w.id")} AS favorite`;

const WordColumns = `w.id, w.term, w.ipa, w.meaning, w.audio_key, w.image_key, ${ExamplesJson}, ${NumbersJson}, ${FavoriteColumn}`;

type WordRow = Omit<Word, "examples" | "numbers" | "favorite"> & {
  examples_json: string;
  numbers_json: string;
  favorite: number;
};
type WordWithGroupsRow = WordRow & { groups_json: string };

const toWord = ({ examples_json, numbers_json, favorite, ...w }: WordRow): Word => ({
  ...w,
  examples: JSON.parse(examples_json) as Example[],
  numbers: JSON.parse(numbers_json) as SourceNumber[],
  favorite: favorite === 1,
});

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
): Promise<WordWithGroups[]> => {
  const { results } = await db
    .prepare(
      `SELECT ${WordColumns}, ${GroupsJson}
         FROM (SELECT id FROM words ORDER BY id LIMIT ? OFFSET ?) page
         JOIN words w ON w.id = page.id
        ORDER BY w.id`,
    )
    .bind(range.limit, range.offset)
    .all<WordWithGroupsRow>();
  return results.map(toWordWithGroups);
};

export const toggleFavorite = async (db: D1Database, wordId: number): Promise<boolean> => {
  const removed = await db
    .prepare(`DELETE FROM group_words WHERE group_id = ${FavoritesGroupId} AND word_id = ?`)
    .bind(wordId)
    .run();
  if (removed.meta.changes > 0) return false;
  await db
    .prepare(
      `INSERT INTO group_words (group_id, word_id, sort_order)
       SELECT ${FavoritesGroupId}, w.id,
              COALESCE((SELECT MAX(sort_order) FROM group_words WHERE group_id = ${FavoritesGroupId}), 0) + 1
         FROM words w WHERE w.id = ?`,
    )
    .bind(wordId)
    .run();
  return true;
};
