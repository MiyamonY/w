import { type Context, Hono } from "hono";
import { csrf } from "hono/csrf";
import { z } from "zod/mini";
import {
  countWords,
  getGroup,
  getWord,
  listCardWordIds,
  listAllWords,
  listGroups,
  listGroupWords,
  toggleFavorite,
} from "./backend/db";
import { serveObject } from "./backend/storage";
import { requireAccess } from "./backend/auth";
import { generatePassage, PassageError } from "./backend/openai";
import {
  createPassage,
  getPassage,
  listPassages,
  markRevealed,
  pickTestWords,
  TestRequestSchema,
} from "./backend/passages";
import {
  AnswerSchema,
  answerQuestion,
  getQuestions,
  pickQuestionIds,
  QuestionIdsSchema,
  QuizRequestSchema,
} from "./backend/quizzes";
import {
  CardQuerySchema,
  GroupFilterSchema,
  PlayerQuerySchema,
  resolvePaging,
} from "./backend/paging";
import { getSettings, SettingsSchema, updateSettings } from "./backend/settings";
import { Card } from "./view/components/card";
import { FavoriteButton, FavoriteButtonVariants } from "./view/components/favorite-button";
import { TestForm } from "./view/components/test-form";
import { QuizForm } from "./view/components/quiz-form";
import { QuizQuestion } from "./view/components/quiz-question";
import { PagedWordTable } from "./view/components/paged-word-table";
import { SettingsForm } from "./view/components/settings-form";
import { AllWordList } from "./view/pages/all-word-list";
import { GroupList } from "./view/pages/group-list";
import { Player } from "./view/pages/player";
import { QuizPage } from "./view/pages/quiz";
import { SettingsPage } from "./view/pages/settings";
import { TestPage } from "./view/pages/test";
import { TestListPage } from "./view/pages/test-list";
import { wordsUrl } from "./view/helper/words-url";

const app = new Hono<{ Bindings: Env }>();

const wantsFragment = (c: Context) =>
  c.req.header("hx-request") === "true" && c.req.header("hx-history-restore-request") !== "true";

app.use(requireAccess);
app.use(csrf());

app.get("/", async (c) => {
  const [groups, totalWords] = await Promise.all([listGroups(c.env.DB), countWords(c.env.DB)]);
  return c.html(<GroupList groups={groups} totalWords={totalWords} />);
});

app.get("/words", async (c) => {
  const db = c.env.DB;
  const requestedGroupId = GroupFilterSchema.parse(c.req.query("group"));
  const [groups, group] = await Promise.all([
    listGroups(db),
    requestedGroupId === undefined ? null : getGroup(db, requestedGroupId),
  ]);
  const total = group ? group.word_count : await countWords(db);
  const paging = resolvePaging(c.req.query(), total);
  const range = { limit: paging.per, offset: paging.offset };
  const words = group ? await listGroupWords(db, group.id, range) : await listAllWords(db, range);
  const groupId = group?.id;
  c.header("Vary", "HX-Request");
  return c.html(
    wantsFragment(c) ? (
      <PagedWordTable words={words} paging={paging} groups={groups} groupId={groupId} />
    ) : (
      <AllWordList words={words} paging={paging} groups={groups} groupId={groupId} />
    ),
  );
});

app.get("/groups/:id{[0-9]+}", async (c) => {
  const query = PlayerQuerySchema.safeParse(c.req.query());
  if (!query.success) return c.text("Bad Request", 400);
  const { start: requested, only } = query.data;
  const id = Number(c.req.param("id"));
  const [group, wordIds, settings] = await Promise.all([
    getGroup(c.env.DB, id),
    listCardWordIds(c.env.DB, id, only),
    getSettings(c.env.DB),
  ]);
  if (!group) return c.notFound();
  const start = wordIds.length > 0 ? requested % wordIds.length : 0;
  const first = wordIds.length > 0 ? await getWord(c.env.DB, wordIds[start]) : null;
  return c.html(
    <Player
      group={group}
      start={start}
      first={first}
      settings={settings}
      wordIds={wordIds}
      filter={only}
    />,
  );
});

app.get("/groups/:id{[0-9]+}/words", (c) =>
  c.redirect(wordsUrl({ group: Number(c.req.param("id")) }), 301),
);

app.get("/groups/:id{[0-9]+}/cards/:wordId{[0-9]+}", async (c) => {
  const { index, total, only } = CardQuerySchema.parse(c.req.query());
  const [word, settings] = await Promise.all([
    getWord(c.env.DB, Number(c.req.param("wordId"))),
    getSettings(c.env.DB),
  ]);
  if (!word) return c.notFound();
  return c.html(
    <Card
      groupId={Number(c.req.param("id"))}
      index={index}
      total={total}
      filter={only}
      word={word}
      showExamplesOnFront={settings.show_examples_on_front}
    />,
  );
});

app.post("/words/:id{[0-9]+}/favorite", async (c) => {
  const wordId = Number(c.req.param("id"));
  const variant = z.catch(z.enum(FavoriteButtonVariants), "inline").parse(c.req.query("variant"));
  const favorite = await toggleFavorite(c.env.DB, wordId);
  return c.html(<FavoriteButton wordId={wordId} favorite={favorite} variant={variant} />);
});

app.get("/images/:key{.+}", (c) =>
  serveObject(c.env.AUDIO, `images/${c.req.param("key")}`, c.req.raw),
);

app.get("/groups/:id{[0-9]+}/tests", async (c) => {
  const id = Number(c.req.param("id"));
  const group = await getGroup(c.env.DB, id);
  if (!group) return c.notFound();
  const passages = await listPassages(c.env.DB, id);
  return c.html(<TestListPage group={group} passages={passages} />);
});

app.post("/groups/:id{[0-9]+}/quizzes", async (c) => {
  const id = Number(c.req.param("id"));
  const group = await getGroup(c.env.DB, id);
  if (!group) return c.notFound();
  const { count, only } = QuizRequestSchema.parse(await c.req.parseBody());
  const ids = await pickQuestionIds(c.env.DB, id, count, only);
  if (ids.length === 0) {
    return c.html(
      <QuizForm
        groupId={id}
        questionCount={group.question_count}
        favoritesCount={group.favorite_count}
        error="出題できる問題がありません。"
      />,
      422,
    );
  }
  const url = `/groups/${id}/quiz?q=${ids.join(",")}`;
  if (c.req.header("hx-request") === "true") {
    c.header("HX-Redirect", url);
    return c.body(null, 200);
  }
  return c.redirect(url, 303);
});

app.get("/groups/:id{[0-9]+}/quiz", async (c) => {
  const id = Number(c.req.param("id"));
  const group = await getGroup(c.env.DB, id);
  if (!group) return c.notFound();
  const ids = QuestionIdsSchema.parse(c.req.query("q")).slice(0, 50);
  const questions = await getQuestions(c.env.DB, ids);
  if (questions.length === 0) return c.redirect(`/groups/${id}/tests`);
  return c.html(<QuizPage group={group} questions={questions} />);
});

app.post("/questions/:id{[0-9]+}/answer", async (c) => {
  const input = AnswerSchema.safeParse(await c.req.parseBody());
  if (!input.success) return c.body(null, 400);
  const question = await answerQuestion(
    c.env.DB,
    Number(c.req.param("id")),
    input.data.number,
    input.data.choice,
  );
  if (!question) return c.notFound();
  return c.html(<QuizQuestion question={question} />);
});

app.post("/groups/:id{[0-9]+}/tests", async (c) => {
  const id = Number(c.req.param("id"));
  const group = await getGroup(c.env.DB, id);
  if (!group) return c.notFound();
  const fail = (error: string) =>
    c.html(<TestForm groupId={id} favoritesCount={group.favorite_count} error={error} />, 422);

  const { count, only } = TestRequestSchema.parse(await c.req.parseBody());
  const words = await pickTestWords(c.env.DB, id, count, only);
  if (words.length === 0) return fail("出題できる単語がありません。");
  try {
    const generated = await generatePassage(c.env, words);
    const passageId = await createPassage(c.env.DB, {
      groupId: id,
      ...generated,
      wordIds: words.map((w) => w.id),
    });
    if (c.req.header("hx-request") === "true") {
      c.header("HX-Redirect", `/tests/${passageId}`);
      return c.body(null, 200);
    }
    return c.redirect(`/tests/${passageId}`, 303);
  } catch (e) {
    if (e instanceof PassageError) return fail(e.message);
    throw e;
  }
});

app.get("/tests/:id{[0-9]+}", async (c) => {
  const passage = await getPassage(c.env.DB, Number(c.req.param("id")));
  if (!passage) return c.notFound();
  return c.html(<TestPage passage={passage} />);
});

app.post("/tests/:id{[0-9]+}/words/:wordId{[0-9]+}/reveal", async (c) => {
  await markRevealed(c.env.DB, Number(c.req.param("id")), Number(c.req.param("wordId")));
  return c.body(null, 204);
});

app.get("/settings", async (c) => {
  const settings = await getSettings(c.env.DB);
  return c.html(<SettingsPage settings={settings} />);
});

app.post("/settings", async (c) => {
  const input = SettingsSchema.safeParse(await c.req.json().catch(() => null));
  if (!input.success) {
    const settings = await getSettings(c.env.DB);
    return c.html(<SettingsForm settings={settings} status="invalid" />, 422);
  }
  await updateSettings(c.env.DB, input.data);
  return c.html(<SettingsForm settings={input.data} status="saved" />);
});

app.get("/audio/:key{.+}", (c) => serveObject(c.env.AUDIO, c.req.param("key"), c.req.raw));

app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
