import { Hono } from "hono";
import { csrf } from "hono/csrf";
import {
  countWords,
  getGroup,
  getWordAt,
  listAllWords,
  listGroups,
  listGroupWords,
} from "./backend/db";
import { serveAudio } from "./backend/audio";
import { requireAccess } from "./backend/auth";
import { getSettings, parseDisplayMs, updateSettings } from "./backend/settings";
import { Card } from "./view/components/card";
import { SettingsForm } from "./view/components/settings-form";
import { AllWordList } from "./view/pages/all-word-list";
import { GroupList } from "./view/pages/group-list";
import { GroupWordList } from "./view/pages/group-word-list";
import { Player } from "./view/pages/player";
import { SettingsPage } from "./view/pages/settings";

const app = new Hono<{ Bindings: Env }>();

app.use(requireAccess);
app.use(csrf());

app.get("/", async (c) => {
  const [groups, totalWords] = await Promise.all([listGroups(c.env.DB), countWords(c.env.DB)]);
  return c.html(<GroupList groups={groups} totalWords={totalWords} />);
});

app.get("/words", async (c) => {
  const words = await listAllWords(c.env.DB);
  return c.html(<AllWordList words={words} />);
});

app.get("/groups/:id{[0-9]+}", async (c) => {
  const id = Number(c.req.param("id"));
  const group = await getGroup(c.env.DB, id);
  if (!group) return c.notFound();
  const requested = Math.max(0, Math.floor(Number(c.req.query("start")) || 0));
  const start = group.word_count > 0 ? requested % group.word_count : 0;
  const [first, settings] = await Promise.all([
    group.word_count > 0 ? getWordAt(c.env.DB, id, start) : null,
    getSettings(c.env.DB),
  ]);
  return c.html(<Player group={group} start={start} first={first} settings={settings} />);
});

app.get("/groups/:id{[0-9]+}/words", async (c) => {
  const id = Number(c.req.param("id"));
  const group = await getGroup(c.env.DB, id);
  if (!group) return c.notFound();
  const words = await listGroupWords(c.env.DB, id);
  return c.html(<GroupWordList group={group} words={words} />);
});

app.get("/groups/:id{[0-9]+}/cards/:index{[0-9]+}", async (c) => {
  const id = Number(c.req.param("id"));
  const group = await getGroup(c.env.DB, id);
  if (!group || group.word_count === 0) return c.notFound();
  const index = Number(c.req.param("index")) % group.word_count;
  const word = await getWordAt(c.env.DB, id, index);
  if (!word) return c.notFound();
  return c.html(<Card groupId={id} index={index} total={group.word_count} word={word} />);
});

app.get("/settings", async (c) => {
  const settings = await getSettings(c.env.DB);
  return c.html(<SettingsPage settings={settings} />);
});

app.post("/settings", async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => null);
  const front_ms = parseDisplayMs(body?.front_ms);
  const back_ms = parseDisplayMs(body?.back_ms);
  if (front_ms === null || back_ms === null) {
    const settings = await getSettings(c.env.DB);
    return c.html(<SettingsForm settings={settings} status="invalid" />, 422);
  }
  const settings = { front_ms, back_ms };
  await updateSettings(c.env.DB, settings);
  return c.html(<SettingsForm settings={settings} status="saved" />);
});

app.get("/audio/:key{.+}", (c) => serveAudio(c.env.AUDIO, c.req.param("key"), c.req.raw));

app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
