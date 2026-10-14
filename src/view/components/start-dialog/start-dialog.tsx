import type { CardFilter } from "../../../backend/db";

type Props = {
  groupId: number;
  allCount: number;
  favoritesCount: number;
};

const StartButton = "cursor-pointer rounded-lg px-3 py-2 text-sm shadow-sm";

const choiceRow = (props: {
  filter: CardFilter;
  label: string;
  total: number;
  urlTemplate: string;
  tone: string;
  button: string;
}) => (
  <section
    data-filter={props.filter}
    data-total={String(props.total)}
    data-url-template={props.urlTemplate}
    class={`rounded-xl p-3 ${props.tone}`}
  >
    <div class="flex items-center justify-between">
      <span class="font-semibold">{props.label}</span>
      <span class="text-sm opacity-80">{props.total} 語</span>
    </div>
    <div class="mt-2 grid grid-cols-2 gap-2">
      <button type="button" data-start="first" class={`${StartButton} ${props.button}`}>
        最初から
      </button>
      <button type="button" data-start="resume" hidden class={`${StartButton} ${props.button}`}>
        続きから
      </button>
    </div>
  </section>
);

export const StartDialog = (props: Props) => {
  const { groupId, allCount, favoritesCount } = props;
  return (
    <dialog
      id="start-dialog"
      class="m-auto w-80 rounded-2xl bg-white p-6 shadow-xl backdrop:bg-black/40"
    >
      <h2 class="mb-4 text-lg font-bold">どこから始めますか？</h2>
      <div class="grid gap-3">
        {choiceRow({
          filter: "all",
          label: "すべての単語",
          total: allCount,
          urlTemplate: `/groups/${groupId}/cards/{index}`,
          tone: "bg-blue-50 text-blue-900",
          button: "bg-blue-700 text-white",
        })}
        {favoritesCount > 0 &&
          choiceRow({
            filter: "favorites",
            label: "★ お気に入りのみ",
            total: favoritesCount,
            urlTemplate: `/groups/${groupId}/cards/{index}?only=favorites`,
            tone: "bg-amber-50 text-amber-900",
            button: "bg-amber-500 text-white",
          })}
      </div>
      <form method="dialog" class="mt-4 text-right">
        <button type="submit" class="cursor-pointer text-sm text-neutral-500">
          あとで選ぶ
        </button>
      </form>
    </dialog>
  );
};
