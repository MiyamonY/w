import { DefaultTestWordCount, TestWordCounts } from "../../../backend/passages";

type Props = {
  groupId: number;
  favoritesCount: number;
  error?: string;
};

export const TestForm = (props: Props) => {
  const { groupId, favoritesCount, error } = props;
  return (
    <form
      method="post"
      action={`/groups/${groupId}/tests`}
      hx-post={`/groups/${groupId}/tests`}
      hx-target="this"
      hx-swap="outerHTML"
      hx-indicator="#generating"
      hx-disabled-elt="find button"
      class="mt-4 grid gap-3 rounded-xl bg-white p-5 shadow-sm"
    >
      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-1.5">
          出題数
          <select name="count" class="rounded-md border border-neutral-300 bg-white p-1">
            {TestWordCounts.map((n) => (
              <option value={String(n)} selected={n === DefaultTestWordCount}>
                {n} 語
              </option>
            ))}
          </select>
        </label>
        {favoritesCount > 0 && (
          <label class="flex items-center gap-1.5">
            <input type="checkbox" name="only" value="favorites" checked />
            お気に入りから選ぶ（{favoritesCount} 語）
          </label>
        )}
      </div>
      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="cursor-pointer rounded-full bg-blue-50 px-6 py-2.5 text-blue-700 disabled:opacity-50"
        >
          開始
        </button>
        <span id="generating" class="htmx-indicator text-sm text-neutral-500">
          生成しています（10〜30秒ほどかかります）…
        </span>
      </div>
      {error && <p class="text-sm text-red-700">{error}</p>}
    </form>
  );
};
