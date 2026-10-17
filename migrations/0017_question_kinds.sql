DROP TRIGGER question_answers_stats_insert;
DROP TRIGGER questions_stats_insert;
DROP TRIGGER questions_stats_delete;
DROP TRIGGER group_words_question_insert;
DROP TRIGGER group_words_question_delete;

ALTER TABLE word_groups DROP COLUMN answered_count;
ALTER TABLE word_groups DROP COLUMN latest_correct_count;

ALTER TABLE question_answers ADD COLUMN kind TEXT NOT NULL DEFAULT 'sentence';
DROP INDEX idx_question_answers_question;
CREATE INDEX idx_question_answers_kind ON question_answers(question_id, kind, id);

CREATE TABLE question_stats (
  question_id    INTEGER NOT NULL REFERENCES questions(id),
  kind           TEXT    NOT NULL,
  attempts       INTEGER NOT NULL DEFAULT 0,
  corrects       INTEGER NOT NULL DEFAULT 0,
  latest_correct INTEGER NOT NULL,
  PRIMARY KEY (question_id, kind)
) WITHOUT ROWID;

INSERT INTO question_stats (question_id, kind, attempts, corrects, latest_correct)
SELECT id, 'sentence', attempts, corrects, latest_correct FROM questions WHERE attempts > 0;

ALTER TABLE questions DROP COLUMN attempts;
ALTER TABLE questions DROP COLUMN corrects;
ALTER TABLE questions DROP COLUMN latest_correct;

CREATE TRIGGER question_answers_stats_insert AFTER INSERT ON question_answers
BEGIN
  INSERT INTO question_stats (question_id, kind, attempts, corrects, latest_correct)
  VALUES (NEW.question_id, NEW.kind, 1, NEW.correct, NEW.correct)
  ON CONFLICT (question_id, kind) DO UPDATE
     SET attempts = attempts + 1,
         corrects = corrects + excluded.corrects,
         latest_correct = excluded.latest_correct;
END;

CREATE TRIGGER questions_stats_insert AFTER INSERT ON questions
BEGIN
  UPDATE word_groups SET question_count = question_count + 1
   WHERE id IN (SELECT group_id FROM group_words WHERE word_id = NEW.word_id);
END;

CREATE TRIGGER questions_stats_delete AFTER DELETE ON questions
BEGIN
  UPDATE word_groups SET question_count = question_count - 1
   WHERE id IN (SELECT group_id FROM group_words WHERE word_id = OLD.word_id);
END;

CREATE TRIGGER group_words_question_insert AFTER INSERT ON group_words
WHEN EXISTS (SELECT 1 FROM questions WHERE word_id = NEW.word_id)
BEGIN
  UPDATE word_groups SET question_count = question_count + 1 WHERE id = NEW.group_id;
END;

CREATE TRIGGER group_words_question_delete AFTER DELETE ON group_words
WHEN EXISTS (SELECT 1 FROM questions WHERE word_id = OLD.word_id)
BEGIN
  UPDATE word_groups SET question_count = question_count - 1 WHERE id = OLD.group_id;
END;
