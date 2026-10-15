export const shortMeaning = (meaning: string) =>
  meaning
    .replace(/（[^）]*）|\([^)]*\)/g, "")
    .split("、")[0]
    .trim() || meaning;
