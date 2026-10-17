import { range, reverse, shuffle } from "remeda";
import { z } from "zod/mini";
import { type PlayOrder, PlayOrders } from "./play-order";

export const PlayOrderStorageKey = "playDirection";

export const buildSequence = (order: PlayOrder, total: number) =>
  order === "reverse"
    ? reverse(range(0, total))
    : order === "random"
      ? shuffle(range(0, total))
      : range(0, total);

const ProgressSchema = z.object({
  order: z.enum(PlayOrders),
  step: z.int().check(z.positive()),
  sequence: z.array(z.int().check(z.nonnegative())),
});
export type Progress = z.infer<typeof ProgressSchema>;

const progressKey = (groupId: string, filter: string) => `card-progress:${groupId}:${filter}`;

export const loadProgress = (groupId: string, filter: string, total: number): Progress | null => {
  try {
    const result = ProgressSchema.safeParse(
      JSON.parse(localStorage.getItem(progressKey(groupId, filter)) ?? ""),
    );
    if (!result.success) return null;
    const { step, sequence } = result.data;
    return step < total && sequence.length === total && sequence.every((i) => i < total)
      ? result.data
      : null;
  } catch {
    return null;
  }
};

export const storeProgress = (groupId: string, filter: string, progress: Progress) =>
  localStorage.setItem(progressKey(groupId, filter), JSON.stringify(progress));
