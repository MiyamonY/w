import { z } from "zod";

const ImageEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_IMAGE_MODEL: z.string().min(1),
});

const ImageResponseSchema = z.object({
  data: z.array(z.object({ b64_json: z.string().min(1) })).min(1),
});

type ImageWord = { id: number; term: string; meaning: string; example: string | null };

const prompt = (word: ImageWord) =>
  [
    `A simple, memorable illustration that helps a Japanese learner remember the English word "${word.term}" (meaning: ${word.meaning}).`,
    "Show one vivid, concrete scene that makes the meaning obvious at a glance, with a touch of humor or exaggeration so it sticks in memory.",
    word.example ? `For context, the word is used like this: "${word.example}".` : "",
    "Flat, colorful illustration style on a plain background. Do not include any text, letters, words, or captions.",
  ]
    .filter((line) => line.length > 0)
    .join("\n");

const detectType = (bytes: Uint8Array) => {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return { ext: "jpg", type: "image/jpeg" };
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return { ext: "png", type: "image/png" };
  return { ext: "webp", type: "image/webp" };
};

export const claimImage = async (db: D1Database, wordId: number) => {
  const row = await db
    .prepare(
      `INSERT INTO word_images (word_id, status) VALUES (?, 'pending')
       ON CONFLICT(word_id) DO UPDATE SET status = 'pending', updated_at = datetime('now')
        WHERE (word_images.status = 'pending' AND word_images.updated_at < datetime('now', '-10 minutes'))
           OR (word_images.status = 'failed' AND word_images.updated_at < datetime('now', '-1 day'))
       RETURNING word_id`,
    )
    .bind(wordId)
    .first<{ word_id: number }>();
  return row !== null;
};

export const getImageKey = async (db: D1Database, wordId: number) =>
  db
    .prepare(`SELECT image_key FROM word_images WHERE word_id = ? AND status = 'done'`)
    .bind(wordId)
    .first<string>("image_key");

const getImageWord = async (db: D1Database, wordId: number) =>
  db
    .prepare(
      `SELECT w.id, w.term, w.meaning,
              (SELECT e.sentence FROM examples e WHERE e.word_id = w.id ORDER BY e.sort_order, e.id LIMIT 1) AS example
         FROM words w WHERE w.id = ?`,
    )
    .bind(wordId)
    .first<ImageWord>();

const requestImage = async (apiKey: string, model: string, word: ImageWord) => {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: prompt(word),
      size: "1024x1024",
      quality: "low",
      output_format: "jpeg",
      output_compression: 70,
    }),
  });
  if (!res.ok)
    throw new Error(`OpenAI API がエラーを返しました（${res.status}）: ${await res.text()}`);
  const { data } = ImageResponseSchema.parse(await res.json());
  return Uint8Array.from(atob(data[0].b64_json), (ch) => ch.charCodeAt(0));
};

export const generateImage = async (
  env: unknown,
  db: D1Database,
  bucket: R2Bucket,
  wordId: number,
): Promise<string | null> => {
  try {
    const config = ImageEnvSchema.parse(env);
    const word = await getImageWord(db, wordId);
    if (!word) throw new Error(`word ${wordId} が見つかりません`);
    const bytes = await requestImage(config.OPENAI_API_KEY, config.OPENAI_IMAGE_MODEL, word);
    const { ext, type } = detectType(bytes);
    const key = `images/${wordId}.${ext}`;
    await bucket.put(key, bytes, { httpMetadata: { contentType: type } });
    await db
      .prepare(
        `UPDATE word_images SET status = 'done', image_key = ?, model = ?, updated_at = datetime('now')
          WHERE word_id = ?`,
      )
      .bind(key, config.OPENAI_IMAGE_MODEL, wordId)
      .run();
    return key;
  } catch (e) {
    console.error("image generation failed", wordId, e);
    await db
      .prepare(
        `UPDATE word_images SET status = 'failed', updated_at = datetime('now') WHERE word_id = ?`,
      )
      .bind(wordId)
      .run();
    return null;
  }
};
