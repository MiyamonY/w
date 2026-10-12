import type { Word } from "../../../backend/db";
import { audioUrl } from "../../helper/audio-url";
import { formatSourceNumbers } from "../../helper/source-numbers";
import { Examples } from "../examples";
import { SpeakButton } from "../speak-button";

type Props = {
  groupId: number;
  index: number;
  total: number;
  word: Word;
  showExamplesOnFront: boolean;
};

const Face =
  "absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-6 text-center shadow-lg backface-hidden transition-transform duration-400";
const FooterButton = "cursor-pointer rounded-full bg-white px-4 py-2 text-lg shadow";

export const Card = (props: Props) => {
  const { groupId, index, total, word, showExamplesOnFront } = props;
  const prev = (index - 1 + total) % total;
  const next = (index + 1) % total;
  return (
    <article
      id="card"
      class="flex h-90 flex-col transition-[translate,rotate,opacity] duration-250 swap-in-next:translate-x-[110%] swap-in-next:opacity-0 swap-in-prev:-translate-x-[110%] swap-in-prev:opacity-0 swap-out-next:-translate-x-[110%] swap-out-next:-rotate-6 swap-out-next:opacity-0 swap-out-prev:translate-x-[110%] swap-out-prev:rotate-6 swap-out-prev:opacity-0"
      data-audio={audioUrl(word.audio_key)}
    >
      <div class="relative flex-1 cursor-pointer perspective-[1000px]">
        <div class={`${Face} flipped:-rotate-y-180`}>
          {word.numbers.length > 0 && (
            <div class="absolute top-3 left-4 text-xs text-neutral-400 tabular-nums">
              {formatSourceNumbers(word.numbers)}
            </div>
          )}
          <div class="text-4xl font-bold">{word.term}</div>
          {showExamplesOnFront && word.examples.length > 0 && (
            <ul class="grid gap-1.5 text-neutral-600">
              {word.examples.map((e) => (
                <li>{e.sentence}</li>
              ))}
            </ul>
          )}
        </div>
        <div class={`${Face} justify-center-safe overflow-y-auto rotate-y-180 flipped:rotate-y-0`}>
          <div class="text-xl font-medium text-neutral-500">{word.term}</div>
          <div class="text-3xl font-semibold">{word.meaning}</div>
          {word.examples.length > 0 && <Examples examples={word.examples} />}
        </div>
      </div>
      <div class="flex items-center justify-center gap-4 pt-3">
        <button
          type="button"
          class={FooterButton}
          data-nav="prev"
          hx-get={`/groups/${groupId}/cards/${prev}`}
          aria-label="前へ"
        >
          ‹
        </button>
        <span class="min-w-16 text-center text-neutral-500">
          {index + 1} / {total}
        </span>
        <SpeakButton audioKey={word.audio_key} label="音声を再生" class={FooterButton} />
        <button
          type="button"
          class={FooterButton}
          data-nav="next"
          hx-get={`/groups/${groupId}/cards/${next}`}
          aria-label="次へ"
        >
          ›
        </button>
      </div>
    </article>
  );
};
