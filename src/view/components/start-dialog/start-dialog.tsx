import { AudioModeLabels, AudioModes, parseAudioMode } from "../../helper/audio-mode";
import { CardFilterLabels, CardFilters, parseCardFilter } from "../../helper/card-filter";
import { PlayOrderLabels, PlayOrders, parsePlayOrder } from "../../helper/play-order";

const StartButton =
  "cursor-pointer rounded-lg bg-blue-50 dark:bg-blue-950 px-3 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-400";

const segmented = (props: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  checked: string;
}) => (
  <fieldset class="mb-4">
    <legend class="mb-1.5 text-sm text-neutral-500 dark:text-neutral-400">{props.legend}</legend>
    <div class="flex overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm">
      {props.options.map((option) => (
        <label class="flex-1 cursor-pointer border-l border-neutral-300 dark:border-neutral-600 py-2 text-center first:border-l-0 has-checked:bg-blue-700 has-checked:text-white has-disabled:cursor-not-allowed has-disabled:opacity-40">
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

export const StartDialog = () => {
  return (
    <dialog
      id="start-dialog"
      class="m-auto w-80 rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-xl backdrop:bg-black/40"
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
      {segmented({
        legend: "単語",
        name: "card-filter",
        options: CardFilters.map((filter) => ({ value: filter, label: CardFilterLabels[filter] })),
        checked: parseCardFilter(null),
      })}
      <p data-count class="mb-2 text-sm text-neutral-500 dark:text-neutral-400" />
      <div class="grid gap-2">
        <button type="button" data-start="first" class={StartButton}>
          最初から
        </button>
        <button type="button" data-start="resume" hidden class={StartButton}>
          続きから
        </button>
      </div>
    </dialog>
  );
};
