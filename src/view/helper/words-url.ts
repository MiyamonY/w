export type WordsQuery = {
  group?: number;
  page?: number;
  per?: number;
};

export const wordsUrl = (query: WordsQuery) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `/words?${search}` : "/words";
};
