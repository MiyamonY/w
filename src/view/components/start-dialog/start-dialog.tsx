import type { CardFilter } from "../../../backend/db";
import { AudioModeLabels, AudioModes, parseAudioMode } from "../../helper/audio-mode";
import { PlayOrderLabels, PlayOrders, parsePlayOrder } from "../../helper/play-order";

const StartButton = "cursor-pointer rounded-lg px-3 py-2 text-sm shadow-sm";

const segmented = (props: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  checked: string;
}) => (
  <fieldset class="mb-4">
    <legend class="mb-1.5 text-sm text-neutral-500">{props.legend}</legend>
    <div class="flex overflow-hidden rounded-lg border border-neutral-300 text-sm">
      {props.options.map((option) => (
        <label class="flex-1 cursor-pointer border-l border-neutral-300 py-2 text-center first:border-l-0 has-checked:bg-blue-700 has-checked:text-white">
          <input
            type="radio"
            name={props.name}
            value={option.value}
            checked={option.value === props.checked}
            class="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  </fieldset>
);

const choiceRow = (props: { filter: CardFilter; label: string; tone: string; button: string }) => (
  <section data-filter={props.filter} class={`rounded-xl p-3 ${props.tone}`}>
    <div class="flex items-center justify-between">
      <span class="font-semibold">{props.label}</span>
      <span data-count class="text-sm opacity-80" />
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

export const StartDialog = () => {
  return (
    <dialog
      id="start-dialog"
      class="m-auto w-80 rounded-2xl bg-white p-6 shadow-xl backdrop:bg-black/40"
    >
      <h2 class="mb-4 text-lg font-bold">どこから始めますか？</h2>
      {segmented({
        legend: "再生する順番",
        name: "play-order",
        options: PlayOrders.map((order) => ({ value: order, label: PlayOrderLabels[order] })),
        checked: parsePlayOrder(null),
      })}
      {segmented({
        legend: "音声",
        name: "audio-mode",
        options: AudioModes.map((mode) => ({ value: mode, label: AudioModeLabels[mode] })),
        checked: parseAudioMode(null),
      })}
      <div class="grid gap-3">
        {choiceRow({
          filter: "all",
          label: "すべての単語",
          tone: "bg-blue-50 text-blue-900",
          button: "bg-blue-700 text-white",
        })}
        {choiceRow({
          filter: "favorites",
          label: "★ お気に入りのみ",
          tone: "bg-amber-50 text-amber-900",
          button: "bg-amber-500 text-white",
        })}
      </div>
    </dialog>
  );
};
