CREATE TABLE words (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  term      TEXT NOT NULL,
  meaning   TEXT NOT NULL,
  audio_key TEXT
);

CREATE TABLE sources (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  title     TEXT NOT NULL,
  author    TEXT,
  publisher TEXT,
  url       TEXT
);

CREATE TABLE examples (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id     INTEGER NOT NULL REFERENCES words(id),
  sentence    TEXT    NOT NULL,
  translation TEXT,
  audio_key   TEXT,
  source_id   INTEGER REFERENCES sources(id),
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE word_groups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE group_words (
  group_id   INTEGER NOT NULL REFERENCES word_groups(id),
  word_id    INTEGER NOT NULL REFERENCES words(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (group_id, word_id)
);

CREATE INDEX idx_words_term ON words(term);
CREATE INDEX idx_examples_word ON examples(word_id, sort_order, id);
CREATE INDEX idx_examples_source ON examples(source_id);
CREATE INDEX idx_group_words_order ON group_words(group_id, sort_order, word_id);
CREATE INDEX idx_group_words_word ON group_words(word_id);
