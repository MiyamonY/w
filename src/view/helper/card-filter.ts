import { isIncludedIn } from "remeda";

export const CardFilters = ["all", "favorites"] as const;
export type CardFilter = (typeof CardFilters)[number];

export const CardFilterLabels: Record<CardFilter, string> = {
  all: "すべて",
  favorites: "★ お気に入り",
};

export const CardFilterStorageKey = "cardFilter";

export const parseCardFilter = (value: string | null | undefined): CardFilter =>
  isIncludedIn(value, CardFilters) ? value : "all";
