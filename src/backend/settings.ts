export type Settings = {
  front_ms: number;
  back_ms: number;
};

export const MinDisplayMs = 500;
export const MaxDisplayMs = 60000;

const DefaultSettings: Settings = { front_ms: 3000, back_ms: 3000 };

export const getSettings = async (db: D1Database): Promise<Settings> => {
  const row = await db
    .prepare(`SELECT front_ms, back_ms FROM settings WHERE id = 1`)
    .first<Settings>();
  return row ?? DefaultSettings;
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

export const parseDisplayMs = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < MinDisplayMs || value > MaxDisplayMs) return null;
  return value;
};
