export const imageUrl = (key: string) => `/${key.split("/").map(encodeURIComponent).join("/")}`;
