CREATE TABLE word_images (
  word_id    INTEGER PRIMARY KEY REFERENCES words(id),
  status     TEXT    NOT NULL CHECK (status IN ('pending', 'done', 'failed')),
  image_key  TEXT,
  model      TEXT,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
