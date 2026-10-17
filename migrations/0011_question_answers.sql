CREATE TABLE question_answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  chosen      INTEGER NOT NULL CHECK (chosen BETWEEN 0 AND 3),
  correct     INTEGER NOT NULL CHECK (correct IN (0, 1)),
  answered_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_question_answers_question ON question_answers(question_id, id);

INSERT INTO question_answers (question_id, chosen, correct, answered_at)
SELECT qq.question_id, qq.chosen, qq.chosen = q.answer, z.created_at
  FROM quiz_questions qq
  JOIN questions q ON q.id = qq.question_id
  JOIN quizzes z ON z.id = qq.quiz_id
 WHERE qq.chosen IS NOT NULL
 ORDER BY z.id, qq.number;

DROP TABLE quiz_questions;
DROP TABLE quizzes;
