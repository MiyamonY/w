CREATE TABLE questions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id         INTEGER NOT NULL UNIQUE REFERENCES words(id),
  sentence        TEXT    NOT NULL,
  choices         TEXT    NOT NULL,
  answer          INTEGER NOT NULL CHECK (answer BETWEEN 0 AND 3),
  choice_meanings TEXT    NOT NULL,
  translation     TEXT    NOT NULL,
  explanation     TEXT    NOT NULL
);

CREATE TABLE quizzes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id   INTEGER NOT NULL REFERENCES word_groups(id),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE quiz_questions (
  quiz_id     INTEGER NOT NULL REFERENCES quizzes(id),
  question_id INTEGER NOT NULL REFERENCES questions(id),
  number      INTEGER NOT NULL,
  chosen      INTEGER CHECK (chosen BETWEEN 0 AND 3),
  PRIMARY KEY (quiz_id, question_id)
);

CREATE INDEX idx_quizzes_group ON quizzes(group_id, id);
