DROP TRIGGER question_answers_stats_insert;
DROP TRIGGER questions_stats_insert;
DROP TRIGGER questions_stats_delete;
DROP TRIGGER group_words_question_insert;
DROP TRIGGER group_words_question_delete;

ALTER TABLE word_groups DROP COLUMN answered_count;
ALTER TABLE word_groups DROP COLUMN latest_correct_count;

CREATE TRIGGER question_answers_stats_insert AFTER INSERT ON question_answers
BEGIN
  UPDATE questions
     SET attempts = attempts + 1, corrects = corrects + NEW.correct, latest_correct = NEW.correct
   WHERE id = NEW.question_id;
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
