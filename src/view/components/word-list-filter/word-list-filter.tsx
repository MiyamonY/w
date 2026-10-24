import type { CardFilter, Group } from "../../../backend/db";
import { PerPageOptions } from "../../../backend/paging";

type Props = {
  groups: Group[];
  groupId?: number;
  filter: CardFilter;
  per: number;
};

const Select =
  "rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-1";

export const WordListFilter = (props: Props) => {
  const { groups, groupId, filter, per } = props;
  return (
    <form
      method="get"
      action="/words"
      hx-get="/words"
      hx-trigger="change"
      class="flex flex-wrap items-center gap-4 text-sm"
    >
      <label class="flex items-center gap-1.5">
        グループ
        <select name="group" class={Select}>
          <option value="" selected={groupId === undefined}>
            すべてのグループ
          </option>
          {groups.map((g) => (
            <option value={String(g.id)} selected={g.id === groupId}>
              {g.name}（{g.word_count}）
            </option>
          ))}
        </select>
      </label>
      <label class="flex items-center gap-1.5">
        <input type="checkbox" name="only" value="favorites" checked={filter === "favorites"} />
        お気に入りのみ
      </label>
      <label class="flex items-center gap-1.5">
        表示件数
        <select name="per" class={Select}>
          {PerPageOptions.map((n) => (
            <option value={String(n)} selected={n === per}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <button type="submit" class="rounded-md bg-white dark:bg-neutral-800 px-2 py-1 shadow-sm">
          表示
        </button>
      </noscript>
    </form>
  );
};
