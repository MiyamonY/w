CREATE TABLE passages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id   INTEGER NOT NULL REFERENCES word_groups(id),
  title      TEXT    NOT NULL,
  body       TEXT    NOT NULL,
  model      TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE passage_words (
  passage_id INTEGER NOT NULL REFERENCES passages(id),
  word_id    INTEGER NOT NULL REFERENCES words(id),
  number     INTEGER NOT NULL,
  revealed   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (passage_id, word_id)
);

CREATE INDEX idx_passages_group ON passages(group_id, id);
