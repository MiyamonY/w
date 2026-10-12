import type { GroupRef } from "../../../backend/db";

type Props = {
  groups: GroupRef[];
};

export const GroupTags = (props: Props) => {
  const { groups } = props;
  if (groups.length === 0) return null;
  return (
    <div class="group-tags">
      {groups.map((g) => (
        <a href={`/groups/${g.id}/words`} class="tag">
          {g.name}
        </a>
      ))}
    </div>
  );
};
