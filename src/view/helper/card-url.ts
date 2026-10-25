import type { CardFilter } from "./card-filter";

type CardQuery = {
  groupId: string;
  wordIds: number[];
  filter: CardFilter;
  index: number;
};

export const cardUrl = (query: CardQuery) => {
  const { groupId, wordIds, filter, index } = query;
  const params = new URLSearchParams({ index: String(index), total: String(wordIds.length) });
  if (filter === "favorites") params.set("only", "favorites");
  return `/groups/${groupId}/cards/${wordIds[index]}?${params}`;
};
