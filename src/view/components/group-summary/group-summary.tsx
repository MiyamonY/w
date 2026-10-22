import type { Group } from "../../../backend/db";
import { GroupCounts } from "../group-counts";

type Props = {
  group: Group;
};

export const GroupSummary = (props: Props) => {
  const { group } = props;
  return (
    <div class="grid grid-cols-[1fr_auto] gap-1">
      <span class="text-lg font-semibold">{group.name}</span>
      <GroupCounts group={group} />
      {group.description && (
        <span class="col-span-full text-sm text-neutral-500">{group.description}</span>
      )}
    </div>
  );
};
