import type { CardFilter } from "../../../backend/db";
import { PlayOrderLabels, PlayOrders } from "../../helper/play-order";

type Props = {
  allCount: number;
  favoritesCount: number;
};

const StartButton = "cursor-pointer rounded-lg px-3 py-2 text-sm shadow-sm";

const choiceRow = (props: {
  filter: CardFilter;
  label: string;
  total: number;
  tone: string;
  button: string;
}) => (
  <section
    data-filter={props.filter}
    data-total={String(props.total)}
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
  const { allCount, favoritesCount } = props;
  return (
    <dialog
      id="start-dialog"
      class="m-auto w-80 rounded-2xl bg-white p-6 shadow-xl backdrop:bg-black/40"
    >
      <h2 class="mb-4 text-lg font-bold">どこから始めますか？</h2>
      <fieldset class="mb-4">
        <legend class="mb-1.5 text-sm text-neutral-500">再生する順番</legend>
        <div class="grid grid-cols-3 overflow-hidden rounded-lg border border-neutral-300 text-sm">
          {PlayOrders.map((order) => (
            <label class="cursor-pointer border-l border-neutral-300 py-2 text-center first:border-l-0 has-checked:bg-blue-700 has-checked:text-white">
              <input
                type="radio"
                name="play-order"
                value={order}
                checked={order === "forward"}
                class="sr-only"
              />
              {PlayOrderLabels[order]}
            </label>
          ))}
        </div>
      </fieldset>
      <div class="grid gap-3">
        {choiceRow({
          filter: "all",
          label: "すべての単語",
          total: allCount,
          tone: "bg-blue-50 text-blue-900",
          button: "bg-blue-700 text-white",
        })}
        {favoritesCount > 0 &&
          choiceRow({
            filter: "favorites",
            label: "★ お気に入りのみ",
            total: favoritesCount,
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
