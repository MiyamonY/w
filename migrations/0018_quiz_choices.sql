CREATE TABLE word_choices (
  word_id INTEGER PRIMARY KEY REFERENCES words(id),
  choices TEXT    NOT NULL CHECK (json_array_length(choices) = 4),
  answer  INTEGER NOT NULL CHECK (answer BETWEEN 0 AND 3)
);

INSERT INTO word_choices (word_id, choices, answer)
SELECT q.word_id,
       (SELECT json_group_array(json_object(
                 'en', CASE WHEN CAST(j.key AS INTEGER) = q.answer THEN w.term ELSE j.value END,
                 'ja', json_extract(q.choice_meanings, '$[' || j.key || ']')))
          FROM json_each(q.choices) j),
       q.answer
  FROM questions q JOIN words w ON w.id = q.word_id;

CREATE TABLE cloze_questions (
  word_id     INTEGER PRIMARY KEY REFERENCES word_choices(word_id),
  sentence    TEXT NOT NULL,
  choices     TEXT NOT NULL CHECK (json_array_length(choices) = 4),
  translation TEXT NOT NULL,
  explanation TEXT NOT NULL
);

INSERT INTO cloze_questions (word_id, sentence, choices, translation, explanation)
SELECT q.word_id, q.sentence,
       (SELECT json_group_array(json_object(
                 'en', j.value,
                 'ja', json_extract(q.choice_meanings, '$[' || j.key || ']')))
          FROM json_each(q.choices) j),
       q.translation, q.explanation
  FROM questions q;

CREATE TABLE quiz_stats (
  word_id  INTEGER NOT NULL REFERENCES words(id),
  kind     TEXT    NOT NULL,
  attempts INTEGER NOT NULL,
  corrects INTEGER NOT NULL,
  recent   TEXT    NOT NULL,
  PRIMARY KEY (word_id, kind)
) WITHOUT ROWID;

INSERT INTO quiz_stats (word_id, kind, attempts, corrects, recent)
SELECT q.word_id, CASE s.kind WHEN 'sentence' THEN 'cloze' ELSE s.kind END,
       s.attempts, s.corrects,
       (SELECT json_group_array(correct)
          FROM (SELECT correct
                  FROM (SELECT a.id, a.correct FROM question_answers a
                         WHERE a.question_id = s.question_id AND a.kind = s.kind
                         ORDER BY a.id DESC LIMIT 10)
                 ORDER BY id))
  FROM question_stats s JOIN questions q ON q.id = s.question_id;

DROP TRIGGER questions_stats_insert;
DROP TRIGGER questions_stats_delete;
DROP TRIGGER group_words_question_insert;
DROP TRIGGER group_words_question_delete;
DROP TABLE question_stats;
DROP TABLE question_answers;
DROP TABLE questions;

ALTER TABLE word_groups DROP COLUMN question_count;
