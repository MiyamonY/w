import { isDefined, mapValues, pickBy } from "remeda";

export type WordsQuery = {
  group?: number;
  only?: "favorites";
  page?: number;
  per?: number;
};

export const wordsUrl = (query: WordsQuery) => {
  const search = new URLSearchParams(mapValues(pickBy(query, isDefined), String)).toString();
  return search ? `/words?${search}` : "/words";
};
