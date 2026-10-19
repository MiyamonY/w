DROP TRIGGER group_words_favorite_insert;
DROP TRIGGER group_words_favorite_delete;
DROP TRIGGER group_words_member_favorite_insert;
DROP TRIGGER group_words_member_favorite_delete;

ALTER TABLE words ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1));

UPDATE words SET favorite = 1
 WHERE id IN (SELECT gw.word_id FROM group_words gw JOIN word_groups g ON g.id = gw.group_id
               WHERE g.kind = 'favorites');

CREATE INDEX idx_words_favorite ON words(id) WHERE favorite = 1;

DELETE FROM group_words WHERE group_id IN (SELECT id FROM word_groups WHERE kind = 'favorites');
DELETE FROM word_groups WHERE kind = 'favorites';
ALTER TABLE word_groups DROP COLUMN kind;

UPDATE word_groups
   SET favorite_count = (SELECT COUNT(*) FROM group_words gw JOIN words w ON w.id = gw.word_id
                          WHERE gw.group_id = word_groups.id AND w.favorite = 1);

ALTER TABLE word_totals ADD COLUMN favorite_count INTEGER NOT NULL DEFAULT 0;
UPDATE word_totals SET favorite_count = (SELECT COUNT(*) FROM words WHERE favorite = 1) WHERE id = 1;

CREATE TRIGGER words_favorite_update AFTER UPDATE OF favorite ON words
WHEN NEW.favorite <> OLD.favorite
BEGIN
  UPDATE word_groups SET favorite_count = favorite_count + NEW.favorite - OLD.favorite
   WHERE id IN (SELECT group_id FROM group_words WHERE word_id = NEW.id);
  UPDATE word_totals SET favorite_count = favorite_count + NEW.favorite - OLD.favorite WHERE id = 1;
END;

CREATE TRIGGER words_favorite_delete AFTER DELETE ON words
WHEN OLD.favorite = 1
BEGIN
  UPDATE word_totals SET favorite_count = favorite_count - 1 WHERE id = 1;
END;

CREATE TRIGGER group_words_favorite_insert AFTER INSERT ON group_words
WHEN (SELECT favorite FROM words WHERE id = NEW.word_id) = 1
BEGIN
  UPDATE word_groups SET favorite_count = favorite_count + 1 WHERE id = NEW.group_id;
END;

CREATE TRIGGER group_words_favorite_delete AFTER DELETE ON group_words
WHEN (SELECT favorite FROM words WHERE id = OLD.word_id) = 1
BEGIN
  UPDATE word_groups SET favorite_count = favorite_count - 1 WHERE id = OLD.group_id;
END;
