import type { Group, Word } from "../../../backend/db";
import type { Settings } from "../../../backend/settings";
import { Card } from "../card";

type Props = {
  group: Group;
  start: number;
  first: Word | null;
  settings: Settings;
};

export const Deck = (props: Props) => {
  const { group, start, first, settings } = props;
  if (!first) return <p class="text-sm text-neutral-500">単語がありません。</p>;
  return (
    <>
      <div
        id="deck"
        class="relative my-6 min-h-90 touch-pan-y overflow-hidden select-none"
        hx-target="#deck"
        hx-swap="innerHTML swap:250ms"
        data-front-ms={String(settings.front_ms)}
        data-back-ms={String(settings.back_ms)}
      >
        <Card
          groupId={group.id}
          index={start}
          total={group.word_count}
          word={first}
          showExamplesOnFront={settings.show_examples_on_front}
        />
      </div>
      <div class="flex items-center justify-center gap-4">
        <button
          id="toggle-play"
          type="button"
          class="cursor-pointer rounded-full bg-blue-700 px-6 py-2.5 text-lg text-white shadow"
        >
          ▶ スタート
        </button>
        <label class="flex items-center gap-1.5">
          <input id="auto-audio" type="checkbox" checked /> 音声を自動再生
        </label>
      </div>
    </>
  );
};
