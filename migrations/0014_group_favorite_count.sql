ALTER TABLE word_groups ADD COLUMN favorite_count INTEGER NOT NULL DEFAULT 0;

UPDATE word_groups
   SET favorite_count = (
         SELECT COUNT(*)
           FROM group_words gw
           JOIN group_words f ON f.word_id = gw.word_id
           JOIN word_groups fg ON fg.id = f.group_id
          WHERE gw.group_id = word_groups.id AND fg.kind = 'favorites')
 WHERE kind <> 'favorites';

CREATE TRIGGER group_words_favorite_insert AFTER INSERT ON group_words
WHEN NEW.group_id = (SELECT id FROM word_groups WHERE kind = 'favorites')
BEGIN
  UPDATE word_groups SET favorite_count = favorite_count + 1
   WHERE id <> NEW.group_id
     AND id IN (SELECT group_id FROM group_words WHERE word_id = NEW.word_id);
END;

CREATE TRIGGER group_words_favorite_delete AFTER DELETE ON group_words
WHEN OLD.group_id = (SELECT id FROM word_groups WHERE kind = 'favorites')
BEGIN
  UPDATE word_groups SET favorite_count = favorite_count - 1
   WHERE id IN (SELECT group_id FROM group_words WHERE word_id = OLD.word_id);
END;

CREATE TRIGGER group_words_member_favorite_insert AFTER INSERT ON group_words
WHEN NEW.group_id <> (SELECT id FROM word_groups WHERE kind = 'favorites')
 AND EXISTS (SELECT 1 FROM group_words f
              WHERE f.group_id = (SELECT id FROM word_groups WHERE kind = 'favorites')
                AND f.word_id = NEW.word_id)
BEGIN
  UPDATE word_groups SET favorite_count = favorite_count + 1 WHERE id = NEW.group_id;
END;

CREATE TRIGGER group_words_member_favorite_delete AFTER DELETE ON group_words
WHEN OLD.group_id <> (SELECT id FROM word_groups WHERE kind = 'favorites')
 AND EXISTS (SELECT 1 FROM group_words f
              WHERE f.group_id = (SELECT id FROM word_groups WHERE kind = 'favorites')
                AND f.word_id = OLD.word_id)
BEGIN
  UPDATE word_groups SET favorite_count = favorite_count - 1 WHERE id = OLD.group_id;
END;
