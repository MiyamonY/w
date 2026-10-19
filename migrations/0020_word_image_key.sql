ALTER TABLE words ADD COLUMN image_key TEXT;

UPDATE words
   SET image_key = (SELECT wi.image_key FROM word_images wi
                     WHERE wi.word_id = words.id AND wi.status = 'done')
 WHERE EXISTS (SELECT 1 FROM word_images wi WHERE wi.word_id = words.id AND wi.status = 'done');
