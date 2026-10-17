CREATE TABLE word_totals (
  id    INTEGER PRIMARY KEY CHECK (id = 1),
  count INTEGER NOT NULL
);

INSERT INTO word_totals (id, count) SELECT 1, COUNT(*) FROM words;

CREATE TRIGGER words_total_insert AFTER INSERT ON words
BEGIN
  UPDATE word_totals SET count = count + 1 WHERE id = 1;
END;

CREATE TRIGGER words_total_delete AFTER DELETE ON words
BEGIN
  UPDATE word_totals SET count = count - 1 WHERE id = 1;
END;
