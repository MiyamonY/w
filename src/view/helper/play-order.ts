import { isIncludedIn } from "remeda";

export const PlayOrders = ["forward", "reverse", "random"] as const;
export type PlayOrder = (typeof PlayOrders)[number];

export const PlayOrderLabels: Record<PlayOrder, string> = {
  forward: "順番",
  reverse: "逆順",
  random: "ランダム",
};

export const parsePlayOrder = (value: string | null | undefined): PlayOrder =>
  isIncludedIn(value, PlayOrders) ? value : "forward";
