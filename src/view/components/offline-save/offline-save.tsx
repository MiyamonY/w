import type { Group } from "../../../backend/db";

type Props = {
  group: Group;
};

// グループのカードを、すべて・お気に入りの両方ともオフライン用に保存する。動きは offline-save.client.ts
export const OfflineSave = (props: Props) => {
  const { group } = props;
  if (group.word_count === 0) return null;
  return (
    <div
      data-offline-save={String(group.id)}
      data-favorites-count={String(group.favorite_count)}
      hidden
      class="flex items-center gap-3 text-sm"
    >
      <button
        type="button"
        class="cursor-pointer rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5 text-neutral-700 dark:text-neutral-200 disabled:cursor-wait disabled:opacity-60"
      >
        オフライン用に保存
      </button>
      <span data-offline-status class="text-neutral-500 dark:text-neutral-400 tabular-nums" />
    </div>
  );
};
