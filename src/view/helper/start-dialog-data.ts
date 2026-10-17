import type { Group } from "../../backend/db";

export const startDialogData = (group: Group) => ({
  "data-start-dialog": String(group.id),
  "data-all-count": String(group.word_count),
  "data-favorites-count": String(group.favorite_count),
});
