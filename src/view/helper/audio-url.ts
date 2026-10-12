export const audioUrl = (key: string | null): string | undefined => {
  return key ? `/audio/${key.split("/").map(encodeURIComponent).join("/")}` : undefined;
};
