ALTER TABLE word_groups ADD COLUMN word_count INTEGER NOT NULL DEFAULT 0;

UPDATE word_groups
   SET word_count = (SELECT COUNT(*) FROM group_words gw WHERE gw.group_id = word_groups.id);

CREATE TRIGGER group_words_count_insert AFTER INSERT ON group_words
BEGIN
  UPDATE word_groups SET word_count = word_count + 1 WHERE id = NEW.group_id;
END;

CREATE TRIGGER group_words_count_delete AFTER DELETE ON group_words
BEGIN
  UPDATE word_groups SET word_count = word_count - 1 WHERE id = OLD.group_id;
END;
