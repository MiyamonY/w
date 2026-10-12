import type { WordWithGroups } from "../../../backend/db";
import { formatSourceNumbers } from "../../helper/source-numbers";
import { Examples } from "../examples";
import { FavoriteButton } from "../favorite-button";
import { GroupTags } from "../group-tags";
import { SpeakButton } from "../speak-button";

type Props = {
  words: WordWithGroups[];
  cardHref?: (index: number) => string;
  currentGroupId?: number;
};

const Cell = "px-3 py-2.5 align-top";

export const WordTable = (props: Props) => {
  const { words, cardHref, currentGroupId } = props;
  if (words.length === 0) return <p class="text-sm text-neutral-500">単語がありません。</p>;
  return (
    <table class="w-full overflow-hidden rounded-xl bg-white text-sm shadow-sm">
      <thead class="bg-slate-50 text-left whitespace-nowrap text-neutral-500">
        <tr>
          <th class={`${Cell} w-px text-right`}>ID</th>
          <th class={`${Cell} w-px`}>No.</th>
          <th class={Cell}>単語</th>
          <th class={Cell}>意味</th>
          <th class={Cell}>例文</th>
          <th class={Cell}>グループ</th>
        </tr>
      </thead>
      <tbody>
        {words.map((w, i) => (
          <tr class="border-t border-neutral-100">
            <td class={`${Cell} text-right text-neutral-400 tabular-nums`}>{w.id}</td>
            <td class={`${Cell} whitespace-nowrap tabular-nums`}>
              {w.numbers.length > 0 && formatSourceNumbers(w.numbers, "")}
            </td>
            <td class={`${Cell} font-semibold whitespace-nowrap`}>
              {cardHref ? (
                <a href={cardHref(i)} class="underline">
                  {w.term}
                </a>
              ) : (
                w.term
              )}
              <SpeakButton audioKey={w.audio_key} label="音声を再生" />
              <FavoriteButton wordId={w.id} favorite={w.favorite} />
            </td>
            <td class={Cell}>{w.meaning}</td>
            <td class={Cell}>{w.examples.length > 0 && <Examples examples={w.examples} />}</td>
            <td class={Cell}>
              <GroupTags groups={w.groups.filter((g) => g.id !== currentGroupId)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
