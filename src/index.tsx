import { type Context, Hono } from "hono";
import { csrf } from "hono/csrf";
import { z } from "zod";
import {
  countGroupFavorites,
  countWords,
  getGroup,
  getWordAt,
  listAllWords,
  listGroups,
  listGroupWords,
  toggleFavorite,
} from "./backend/db";
import { serveAudio } from "./backend/audio";
import { requireAccess } from "./backend/auth";
import {
  CardFilterSchema,
  GroupFilterSchema,
  resolvePaging,
  StartIndexSchema,
} from "./backend/paging";
import { getSettings, SettingsSchema, updateSettings } from "./backend/settings";
import { Card } from "./view/components/card";
import { FavoriteButton, FavoriteButtonVariants } from "./view/components/favorite-button";
import { PagedWordTable } from "./view/components/paged-word-table";
import { SettingsForm } from "./view/components/settings-form";
import { AllWordList } from "./view/pages/all-word-list";
import { GroupList } from "./view/pages/group-list";
import { Player } from "./view/pages/player";
import { SettingsPage } from "./view/pages/settings";
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
  const id = Number(c.req.param("id"));
  const group = await getGroup(c.env.DB, id);
  if (!group) return c.notFound();
  const requested = StartIndexSchema.parse(c.req.query("start"));
  const start = group.word_count > 0 ? requested % group.word_count : 0;
  const askFilter = c.req.query("start") === undefined && group.kind !== "favorites";
  const [first, settings, favoritesCount] = await Promise.all([
    group.word_count > 0 ? getWordAt(c.env.DB, id, start) : null,
    getSettings(c.env.DB),
    askFilter ? countGroupFavorites(c.env.DB, id) : undefined,
  ]);
  return c.html(
    <Player
      group={group}
      start={start}
      first={first}
      settings={settings}
      favoritesCount={favoritesCount}
    />,
  );
});

app.get("/groups/:id{[0-9]+}/words", (c) =>
  c.redirect(wordsUrl({ group: Number(c.req.param("id")) }), 301),
);

app.get("/groups/:id{[0-9]+}/cards/:index{[0-9]+}", async (c) => {
  const id = Number(c.req.param("id"));
  const group = await getGroup(c.env.DB, id);
  if (!group) return c.notFound();
  const filter = CardFilterSchema.parse(c.req.query("only"));
  const total = filter === "favorites" ? await countGroupFavorites(c.env.DB, id) : group.word_count;
  if (total === 0) return c.notFound();
  const index = Number(c.req.param("index")) % total;
  const [word, settings] = await Promise.all([
    getWordAt(c.env.DB, id, index, filter),
    getSettings(c.env.DB),
  ]);
  if (!word) return c.notFound();
  return c.html(
    <Card
      groupId={id}
      index={index}
      total={total}
      filter={filter}
      word={word}
      showExamplesOnFront={settings.show_examples_on_front}
    />,
  );
});

app.post("/words/:id{[0-9]+}/favorite", async (c) => {
  const wordId = Number(c.req.param("id"));
  const variant = z.enum(FavoriteButtonVariants).catch("inline").parse(c.req.query("variant"));
  const favorite = await toggleFavorite(c.env.DB, wordId);
  return c.html(<FavoriteButton wordId={wordId} favorite={favorite} variant={variant} />);
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

app.get("/audio/:key{.+}", (c) => serveAudio(c.env.AUDIO, c.req.param("key"), c.req.raw));

app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
