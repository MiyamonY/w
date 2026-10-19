import { z } from "zod/mini";

export const MinDisplayMs = 500;
export const MaxDisplayMs = 60000;

const DisplayMsSchema = z.int().check(z.minimum(MinDisplayMs), z.maximum(MaxDisplayMs));

export const SettingsSchema = z.object({
  front_ms: DisplayMsSchema,
  back_ms: DisplayMsSchema,
});

export type Settings = z.infer<typeof SettingsSchema>;

const DefaultSettings: Settings = { front_ms: 3000, back_ms: 3000 };

export const getSettings = async (db: D1Database): Promise<Settings> => {
  const row = await db.prepare(`SELECT front_ms, back_ms FROM settings WHERE id = 1`).first();
  return row ? SettingsSchema.parse(row) : DefaultSettings;
};

export const updateSettings = async (db: D1Database, settings: Settings): Promise<void> => {
  await db
    .prepare(
      `INSERT INTO settings (id, front_ms, back_ms) VALUES (1, ?1, ?2)
       ON CONFLICT (id) DO UPDATE SET front_ms = ?1, back_ms = ?2`,
    )
    .bind(settings.front_ms, settings.back_ms)
    .run();
};
