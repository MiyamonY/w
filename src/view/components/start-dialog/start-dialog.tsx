type Props = {
  groupId: number;
  allCount: number;
  favoritesCount: number;
};

const Choice =
  "w-full cursor-pointer rounded-xl px-4 py-3 text-left shadow-sm flex items-center justify-between";

export const StartDialog = (props: Props) => {
  const { groupId, allCount, favoritesCount } = props;
  return (
    <dialog
      id="start-dialog"
      class="m-auto w-80 rounded-2xl bg-white p-6 shadow-xl backdrop:bg-black/40"
    >
      <h2 class="mb-4 text-lg font-bold">どの単語で始めますか？</h2>
      <div class="grid gap-3">
        <button type="button" data-only="all" class={`${Choice} bg-blue-700 text-white`}>
          <span>すべての単語</span>
          <span class="text-sm text-blue-100">{allCount} 語</span>
        </button>
        <button
          type="button"
          data-only="favorites"
          data-url={`/groups/${groupId}/cards/0?only=favorites`}
          class={`${Choice} bg-amber-50 text-amber-800`}
        >
          <span>★ お気に入りのみ</span>
          <span class="text-sm text-amber-600">{favoritesCount} 語</span>
        </button>
      </div>
      <form method="dialog" class="mt-4 text-right">
        <button type="submit" class="cursor-pointer text-sm text-neutral-500">
          あとで選ぶ
        </button>
      </form>
    </dialog>
  );
};
