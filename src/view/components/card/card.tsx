import type { CardFilter, WordWithGroups } from "../../../backend/db";
import { audioUrl } from "../../helper/audio-url";
import { formatSourceNumbers } from "../../helper/source-numbers";
import { Examples } from "../examples";
import { FavoriteButton } from "../favorite-button";
import { GroupTags } from "../group-tags";
import { QuizResults } from "../quiz-results";
import { SpeakButton } from "../speak-button";
import { WordImage } from "../word-image";

type Props = {
  groupId: number;
  index: number;
  total: number;
  word: WordWithGroups;
  showExamplesOnFront: boolean;
  filter?: CardFilter;
};

const Face =
  "absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-6 text-center shadow-lg backface-hidden transition-transform duration-400";

export const Card = (props: Props) => {
  const { groupId, index, total, word, showExamplesOnFront, filter = "all" } = props;
  const groups = word.groups.filter((g) => g.id !== groupId);
  const cardUrl = (i: number) =>
    `/groups/${groupId}/cards/${i}${filter === "favorites" ? "?only=favorites" : ""}`;
  return (
    <article
      id="card"
      class="flex h-105 flex-col transition-[translate,rotate,opacity] duration-250 swap-in-next:translate-x-[110%] swap-in-next:opacity-0 swap-in-prev:-translate-x-[110%] swap-in-prev:opacity-0 swap-out-next:-translate-x-[110%] swap-out-next:-rotate-6 swap-out-next:opacity-0 swap-out-prev:translate-x-[110%] swap-out-prev:rotate-6 swap-out-prev:opacity-0"
      data-audio={audioUrl(word.audio_key)}
      data-index={String(index)}
      data-total={String(total)}
      data-url-template={cardUrl(0).replace("/cards/0", "/cards/{index}")}
    >
      <div class="relative flex-1 cursor-pointer perspective-[1000px]">
        <FavoriteButton wordId={word.id} favorite={word.favorite} variant="corner" />
        <div class={`${Face} flipped:-rotate-y-180`}>
          {word.numbers.length > 0 && (
            <div class="absolute top-3 left-4 text-xs text-neutral-400 tabular-nums">
              {formatSourceNumbers(word.numbers)}
            </div>
          )}
          <div class="flex items-center gap-2">
            <div class="text-4xl font-bold">{word.term}</div>
            <SpeakButton
              audioKey={word.audio_key}
              label="音声を再生"
              class="cursor-pointer p-1 text-2xl leading-none"
            />
          </div>
          {word.ipa && <div class="-mt-2 text-lg text-neutral-500">/{word.ipa}/</div>}
          {showExamplesOnFront && word.examples.length > 0 && (
            <ul class="grid gap-1.5 text-neutral-600">
              {word.examples.map((e) => (
                <li>{e.sentence}</li>
              ))}
            </ul>
          )}
          {(word.quiz_results.length > 0 || groups.length > 0) && (
            <div class="absolute inset-x-4 bottom-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
              {word.quiz_results.length > 0 && (
                <span class="text-neutral-400">
                  4択 <QuizResults results={word.quiz_results} />
                </span>
              )}
              <GroupTags groups={groups} />
            </div>
          )}
        </div>
        <div class={`${Face} justify-center-safe overflow-y-auto rotate-y-180 flipped:rotate-y-0`}>
          <div class="flex items-center gap-1">
            <div class="text-xl font-medium text-neutral-500">{word.term}</div>
            {word.ipa && <div class="text-neutral-400">/{word.ipa}/</div>}
            <SpeakButton
              audioKey={word.audio_key}
              label="音声を再生"
              class="cursor-pointer p-1 leading-none"
            />
          </div>
          <WordImage wordId={word.id} imageKey={word.image_key} />
          <div class="text-3xl font-semibold">{word.meaning}</div>
          {word.examples.length > 0 && <Examples examples={word.examples} />}
        </div>
      </div>
    </article>
  );
};
