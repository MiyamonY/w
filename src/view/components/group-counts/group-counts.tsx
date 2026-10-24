import type { Group } from "../../../backend/db";

type Props = {
  group: Group;
};

export const GroupCounts = (props: Props) => {
  const { group } = props;
  return (
    <span class="text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">
      {group.word_count} 語 ・ <span class="text-amber-500">★</span>{" "}
      <span aria-label="お気に入り">{group.favorite_count}</span>
    </span>
  );
};
