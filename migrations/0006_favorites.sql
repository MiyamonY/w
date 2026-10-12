ALTER TABLE word_groups ADD COLUMN kind TEXT NOT NULL DEFAULT 'normal';

INSERT INTO word_groups (name, description, sort_order, kind)
VALUES ('お気に入り', 'お気に入りに登録した単語', 0, 'favorites');
