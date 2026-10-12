export type Group = {
  id: number;
  name: string;
  description: string | null;
  word_count: number;
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
  meaning: string;
  audio_key: string | null;
  examples: Example[];
  numbers: SourceNumber[];
};

export type GroupRef = { id: number; name: string };
export type WordWithGroups = Word & { groups: GroupRef[] };

export const listGroups = async (db: D1Database): Promise<Group[]> => {
  const { results } = await db
    .prepare(
      `SELECT g.id, g.name, g.description, COUNT(gw.word_id) AS word_count
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
      `SELECT g.id, g.name, g.description,
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

const WordColumns = `w.id, w.term, w.meaning, w.audio_key, ${ExamplesJson}, ${NumbersJson}`;

type WordRow = Omit<Word, "examples" | "numbers"> & { examples_json: string; numbers_json: string };
type WordWithGroupsRow = WordRow & { groups_json: string };

const toWord = ({ examples_json, numbers_json, ...w }: WordRow): Word => ({
  ...w,
  examples: JSON.parse(examples_json) as Example[],
  numbers: JSON.parse(numbers_json) as SourceNumber[],
});

const toWordWithGroups = ({ groups_json, ...row }: WordWithGroupsRow): WordWithGroups => ({
  ...toWord(row),
  groups: JSON.parse(groups_json) as GroupRef[],
});

export const getWordAt = async (
  db: D1Database,
  groupId: number,
  index: number,
): Promise<Word | null> => {
  const row = await db
    .prepare(
      `SELECT ${WordColumns}
         FROM group_words gw
         JOIN words w ON w.id = gw.word_id
        WHERE gw.group_id = ?
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
