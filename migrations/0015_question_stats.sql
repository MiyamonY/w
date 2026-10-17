ALTER TABLE questions ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE questions ADD COLUMN corrects INTEGER NOT NULL DEFAULT 0;
ALTER TABLE questions ADD COLUMN latest_correct INTEGER;

UPDATE questions
   SET attempts = (SELECT COUNT(*) FROM question_answers a WHERE a.question_id = questions.id),
       corrects = (SELECT COUNT(*) FROM question_answers a
                    WHERE a.question_id = questions.id AND a.correct = 1),
       latest_correct = (SELECT a.correct FROM question_answers a
                          WHERE a.question_id = questions.id ORDER BY a.id DESC LIMIT 1);

ALTER TABLE word_groups ADD COLUMN question_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE word_groups ADD COLUMN answered_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE word_groups ADD COLUMN latest_correct_count INTEGER NOT NULL DEFAULT 0;

UPDATE word_groups
   SET question_count = (SELECT COUNT(*) FROM group_words gw JOIN questions q ON q.word_id = gw.word_id
                          WHERE gw.group_id = word_groups.id),
       answered_count = (SELECT COUNT(*) FROM group_words gw JOIN questions q ON q.word_id = gw.word_id
                          WHERE gw.group_id = word_groups.id AND q.attempts > 0),
       latest_correct_count = (SELECT COALESCE(SUM(q.latest_correct), 0)
                                 FROM group_words gw JOIN questions q ON q.word_id = gw.word_id
                                WHERE gw.group_id = word_groups.id);

CREATE TRIGGER question_answers_stats_insert AFTER INSERT ON question_answers
BEGIN
  UPDATE word_groups
     SET answered_count = answered_count
           + (SELECT attempts = 0 FROM questions WHERE id = NEW.question_id),
         latest_correct_count = latest_correct_count + NEW.correct
           - (SELECT COALESCE(latest_correct, 0) FROM questions WHERE id = NEW.question_id)
   WHERE id IN (SELECT gw.group_id FROM group_words gw JOIN questions q ON q.word_id = gw.word_id
                 WHERE q.id = NEW.question_id);
  UPDATE questions
     SET attempts = attempts + 1, corrects = corrects + NEW.correct, latest_correct = NEW.correct
   WHERE id = NEW.question_id;
END;

CREATE TRIGGER questions_stats_insert AFTER INSERT ON questions
BEGIN
  UPDATE word_groups
     SET question_count = question_count + 1,
         answered_count = answered_count + (NEW.attempts > 0),
         latest_correct_count = latest_correct_count + COALESCE(NEW.latest_correct, 0)
   WHERE id IN (SELECT group_id FROM group_words WHERE word_id = NEW.word_id);
END;

CREATE TRIGGER questions_stats_delete AFTER DELETE ON questions
BEGIN
  UPDATE word_groups
     SET question_count = question_count - 1,
         answered_count = answered_count - (OLD.attempts > 0),
         latest_correct_count = latest_correct_count - COALESCE(OLD.latest_correct, 0)
   WHERE id IN (SELECT group_id FROM group_words WHERE word_id = OLD.word_id);
END;

CREATE TRIGGER group_words_question_insert AFTER INSERT ON group_words
WHEN EXISTS (SELECT 1 FROM questions WHERE word_id = NEW.word_id)
BEGIN
  UPDATE word_groups
     SET question_count = question_count + 1,
         answered_count = answered_count
           + (SELECT attempts > 0 FROM questions WHERE word_id = NEW.word_id),
         latest_correct_count = latest_correct_count
           + (SELECT COALESCE(latest_correct, 0) FROM questions WHERE word_id = NEW.word_id)
   WHERE id = NEW.group_id;
END;

CREATE TRIGGER group_words_question_delete AFTER DELETE ON group_words
WHEN EXISTS (SELECT 1 FROM questions WHERE word_id = OLD.word_id)
BEGIN
  UPDATE word_groups
     SET question_count = question_count - 1,
         answered_count = answered_count
           - (SELECT attempts > 0 FROM questions WHERE word_id = OLD.word_id),
         latest_correct_count = latest_correct_count
           - (SELECT COALESCE(latest_correct, 0) FROM questions WHERE word_id = OLD.word_id)
   WHERE id = OLD.group_id;
END;
