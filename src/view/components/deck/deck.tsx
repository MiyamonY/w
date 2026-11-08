import type { CardFilter, Group, Word } from "../../../backend/db";
import type { Settings } from "../../../backend/settings";
import { DefaultPlaybackRate, formatPlaybackRate, PlaybackRates } from "../../helper/playback-rate";
import { Card } from "../card";
import { CardPosition } from "../card-position";
import { ElapsedTime } from "../elapsed-time";

type Props = {
  group: Group;
  start: number;
  first: Word | null;
  settings: Settings;
  wordIds: number[];
  filter: CardFilter;
};

export const Deck = (props: Props) => {
  const { group, start, first, settings, wordIds, filter } = props;
  if (!first)
    return <p class="text-sm text-neutral-500 dark:text-neutral-400">単語がありません。</p>;
  return (
    <>
      <div
        id="deck"
        data-group-id={String(group.id)}
        data-word-ids={JSON.stringify(wordIds)}
        class="relative my-6 min-h-110 touch-pan-y overflow-hidden select-none"
        hx-target="#deck"
        hx-swap="innerHTML swap:250ms"
        data-front-ms={String(settings.front_ms)}
        data-back-ms={String(settings.back_ms)}
      >
        <Card index={start} total={wordIds.length} filter={filter} word={first} />
      </div>
      <CardPosition position={start + 1} total={wordIds.length} />
      <div class="flex flex-wrap items-center justify-center gap-4">
        <button
          id="toggle-play"
          type="button"
          aria-label="再生"
          class="cursor-pointer rounded-full bg-blue-700 px-6 py-2.5 text-lg text-white shadow"
        >
          ▶
        </button>
        <label class="flex items-center gap-1.5">
          <input id="auto-audio" type="checkbox" checked /> 自動
        </label>
        <label class="flex items-center gap-1.5">
          速度
          <select
            id="playback-rate"
            class="rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-1 tabular-nums"
          >
            {PlaybackRates.map((rate) => (
              <option value={formatPlaybackRate(rate)} selected={rate === DefaultPlaybackRate}>
                {formatPlaybackRate(rate)}x
              </option>
            ))}
          </select>
        </label>
        <button
          id="toggle-pip"
          type="button"
          hidden
          aria-label="小窓で表示"
          title="小窓で表示"
          class="cursor-pointer rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-1.5 text-neutral-700 dark:text-neutral-200"
        >
          <svg viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true">
            <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z" />
          </svg>
        </button>
      </div>
      <ElapsedTime />
      <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur">
        <div class="mx-auto grid max-w-140 grid-cols-2">
          <button
            type="button"
            data-nav-button="prev"
            aria-label="前のカード"
            class="cursor-pointer py-4 text-3xl text-blue-700 dark:text-blue-400 active:bg-neutral-100 dark:active:bg-neutral-700"
          >
            ‹
          </button>
          <button
            type="button"
            data-nav-button="next"
            aria-label="次のカード"
            class="cursor-pointer border-l border-neutral-200 dark:border-neutral-700 py-4 text-3xl text-blue-700 dark:text-blue-400 active:bg-neutral-100 dark:active:bg-neutral-700"
          >
            ›
          </button>
        </div>
      </nav>
      <div class="h-20" aria-hidden="true" />
    </>
  );
};
