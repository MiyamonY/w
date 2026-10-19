CREATE TABLE word_sources (
  word_id   INTEGER NOT NULL REFERENCES words(id),
  source_id INTEGER NOT NULL REFERENCES sources(id),
  number    INTEGER NOT NULL,
  examples  TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(examples)),
  PRIMARY KEY (word_id, source_id),
  UNIQUE (source_id, number)
) WITHOUT ROWID;

INSERT INTO word_sources (word_id, source_id, number, examples)
SELECT sw.word_id, sw.source_id, sw.number,
       (SELECT json_group_array(json_object(
                 'sentence', e.sentence, 'translation', e.translation, 'audio_key', e.audio_key))
          FROM (SELECT sentence, translation, audio_key FROM examples
                 WHERE word_id = sw.word_id AND source_id = sw.source_id
                 ORDER BY sort_order, id) e)
  FROM source_words sw;
