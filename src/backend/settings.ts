export type Settings = {
  front_ms: number;
  back_ms: number;
  show_examples_on_front: boolean;
};

export const MinDisplayMs = 500;
export const MaxDisplayMs = 60000;

const DefaultSettings: Settings = { front_ms: 3000, back_ms: 3000, show_examples_on_front: false };

type SettingsRow = Omit<Settings, "show_examples_on_front"> & { show_examples_on_front: number };

export const getSettings = async (db: D1Database): Promise<Settings> => {
  const row = await db
    .prepare(`SELECT front_ms, back_ms, show_examples_on_front FROM settings WHERE id = 1`)
    .first<SettingsRow>();
  if (!row) return DefaultSettings;
  return { ...row, show_examples_on_front: row.show_examples_on_front === 1 };
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

export const parseDisplayMs = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < MinDisplayMs || value > MaxDisplayMs) return null;
  return value;
};

export const parseBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;
