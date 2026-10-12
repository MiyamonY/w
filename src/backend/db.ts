export type Group = {
  id: number;
  name: string;
  description: string | null;
  word_count: number;
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
  examples: Example[];
  numbers: SourceNumber[];
  favorite: boolean;
};

export type GroupRef = { id: number; name: string };
export type WordWithGroups = Word & { groups: GroupRef[] };

export const listGroups = async (db: D1Database): Promise<Group[]> => {
  const { results } = await db
    .prepare(
      `SELECT g.id, g.name, g.description, g.kind, COUNT(gw.word_id) AS word_count
         FROM word_groups g
         LEFT JOIN group_words gw ON gw.group_id = g.id
        GROUP BY g.id
        ORDER BY g.sort_order, g.id`,
    )
    .all<Group>();
  return results;
};

export const getGroup = async (db: D1Database, id: number): Promise<Group | null> => {
  return db
    .prepare(
      `SELECT g.id, g.name, g.description, g.kind,
              (SELECT COUNT(*) FROM group_words gw WHERE gw.group_id = g.id) AS word_count
         FROM word_groups g
        WHERE g.id = ?`,
    )
    .bind(id)
    .first<Group>();
};

export const countWords = async (db: D1Database): Promise<number> => {
  return (await db.prepare(`SELECT COUNT(*) AS n FROM words`).first<number>("n")) ?? 0;
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

const IsFavorite = `EXISTS (SELECT 1 FROM group_words fx JOIN word_groups fg ON fg.id = fx.group_id
           WHERE fg.kind = 'favorites' AND fx.word_id = w.id)`;

const FavoriteColumn = `${IsFavorite} AS favorite`;

const WordColumns = `w.id, w.term, w.ipa, w.meaning, w.audio_key, ${ExamplesJson}, ${NumbersJson}, ${FavoriteColumn}`;

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

export const countGroupFavorites = async (db: D1Database, groupId: number): Promise<number> => {
  const n = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM group_words gw JOIN words w ON w.id = gw.word_id
        WHERE gw.group_id = ? AND ${IsFavorite}`,
    )
    .bind(groupId)
    .first<number>("n");
  return n ?? 0;
};

export const getWordAt = async (
  db: D1Database,
  groupId: number,
  index: number,
  filter: CardFilter = "all",
): Promise<Word | null> => {
  const row = await db
    .prepare(
      `SELECT ${WordColumns}
         FROM group_words gw
         JOIN words w ON w.id = gw.word_id
        WHERE gw.group_id = ? ${filter === "favorites" ? `AND ${IsFavorite}` : ""}
        ORDER BY gw.sort_order, w.id
        LIMIT 1 OFFSET ?`,
    )
    .bind(groupId, index)
    .first<WordRow>();
  return row && toWord(row);
};

export const listGroupWords = async (
  db: D1Database,
  groupId: number,
  range: { limit: number; offset: number },
): Promise<WordWithGroups[]> => {
  const { results } = await db
    .prepare(
      `SELECT ${WordColumns}, ${GroupsJson}
         FROM group_words gw
         JOIN words w ON w.id = gw.word_id
        WHERE gw.group_id = ?
        ORDER BY gw.sort_order, w.id
        LIMIT ? OFFSET ?`,
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
         FROM words w
        ORDER BY w.id
        LIMIT ? OFFSET ?`,
    )
    .bind(range.limit, range.offset)
    .all<WordWithGroupsRow>();
  return results.map(toWordWithGroups);
};

const FavoritesGroupId = `(SELECT id FROM word_groups WHERE kind = 'favorites')`;

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
