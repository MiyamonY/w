CREATE TABLE source_words (
  source_id INTEGER NOT NULL REFERENCES sources(id),
  word_id   INTEGER NOT NULL REFERENCES words(id),
  number    INTEGER NOT NULL,
  PRIMARY KEY (source_id, word_id),
  UNIQUE (source_id, number)
);

CREATE INDEX idx_source_words_word ON source_words(word_id);
