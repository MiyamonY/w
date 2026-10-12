import type { GroupRef } from "../../../backend/db";
import { wordsUrl } from "../../helper/words-url";

type Props = {
  groups: GroupRef[];
};

export const GroupTags = (props: Props) => {
  const { groups } = props;
  if (groups.length === 0) return null;
  return (
    <div class="flex flex-wrap gap-1.5">
      {groups.map((g) => (
        <a
          href={wordsUrl({ group: g.id })}
          class="whitespace-nowrap rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
        >
          {g.name}
        </a>
      ))}
    </div>
  );
};
