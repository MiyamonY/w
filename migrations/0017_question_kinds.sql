CREATE TABLE meaning_answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  chosen      INTEGER NOT NULL CHECK (chosen BETWEEN 0 AND 3),
  correct     INTEGER NOT NULL CHECK (correct IN (0, 1)),
  answered_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_meaning_answers_question ON meaning_answers(question_id, id);

ALTER TABLE questions ADD COLUMN meaning_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE questions ADD COLUMN meaning_corrects INTEGER NOT NULL DEFAULT 0;
ALTER TABLE questions ADD COLUMN meaning_latest_correct INTEGER;

CREATE TRIGGER meaning_answers_stats_insert AFTER INSERT ON meaning_answers
BEGIN
  UPDATE questions
     SET meaning_attempts = meaning_attempts + 1,
         meaning_corrects = meaning_corrects + NEW.correct,
         meaning_latest_correct = NEW.correct
   WHERE id = NEW.question_id;
END;
