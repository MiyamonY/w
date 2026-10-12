import { z } from "zod";

export const MinDisplayMs = 500;
export const MaxDisplayMs = 60000;

const DisplayMsSchema = z.number().int().min(MinDisplayMs).max(MaxDisplayMs);

export const SettingsSchema = z.object({
  front_ms: DisplayMsSchema,
  back_ms: DisplayMsSchema,
  show_examples_on_front: z.boolean(),
});

export type Settings = z.infer<typeof SettingsSchema>;

const SettingsRowSchema = SettingsSchema.extend({
  show_examples_on_front: z.union([z.literal(0), z.literal(1)]).transform((v) => v === 1),
});

const DefaultSettings: Settings = { front_ms: 3000, back_ms: 3000, show_examples_on_front: false };

export const getSettings = async (db: D1Database): Promise<Settings> => {
  const row = await db
    .prepare(`SELECT front_ms, back_ms, show_examples_on_front FROM settings WHERE id = 1`)
    .first();
  return row ? SettingsRowSchema.parse(row) : DefaultSettings;
};

export const updateSettings = async (db: D1Database, settings: Settings): Promise<void> => {
  await db
    .prepare(
      `INSERT INTO settings (id, front_ms, back_ms, show_examples_on_front) VALUES (1, ?1, ?2, ?3)
       ON CONFLICT (id) DO UPDATE SET front_ms = ?1, back_ms = ?2, show_examples_on_front = ?3`,
    )
    .bind(settings.front_ms, settings.back_ms, settings.show_examples_on_front ? 1 : 0)
    .run();
};
