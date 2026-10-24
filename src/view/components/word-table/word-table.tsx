import type { WordWithGroups } from "../../../backend/db";
import { formatSourceNumbers } from "../../helper/source-numbers";
import { Examples } from "../examples";
import { FavoriteButton } from "../favorite-button";
import { GroupTags } from "../group-tags";
import { SpeakButton } from "../speak-button";

type Props = {
  words: WordWithGroups[];
  currentGroupId?: number;
};

const Head = "px-3 py-2.5";
const Cell =
  "block py-0.5 empty:hidden md:table-cell md:px-3 md:py-2.5 md:align-top md:empty:table-cell";
const SubRow = "block md:table-row";
const Revealable = "invisible group-data-[open]/word:visible";
const SubCell = "block pt-1.5 md:table-cell md:px-3 md:pt-0 md:pb-2";

export const WordTable = (props: Props) => {
  const { words, currentGroupId } = props;
  if (words.length === 0)
    return <p class="text-sm text-neutral-500 dark:text-neutral-400">単語がありません。</p>;
  return (
    <table class="block w-full text-sm md:table md:overflow-hidden md:rounded-xl md:bg-white dark:md:bg-neutral-800 md:shadow-sm">
      <thead class="hidden bg-slate-50 dark:bg-neutral-900 text-left whitespace-nowrap text-neutral-500 dark:text-neutral-400 md:table-header-group">
        <tr>
          <th class={`${Head} w-px text-right`}>ID</th>
          <th class={`${Head} w-px`}>No.</th>
          <th class={Head}>単語</th>
          <th class={Head}>意味</th>
          <th class={Head}>例文</th>
        </tr>
      </thead>
      {words.map((w) => {
        const groups = w.groups.filter((g) => g.id !== currentGroupId);
        return (
          <tbody
            data-word-item
            class="group/word mb-3 block cursor-pointer rounded-xl bg-white dark:bg-neutral-800 p-3 shadow-sm md:mb-0 md:table-row-group md:rounded-none md:p-0 md:shadow-none"
          >
            <tr class="block md:table-row md:border-t md:border-neutral-200 dark:md:border-neutral-700">
              <td class="hidden text-right text-neutral-400 dark:text-neutral-500 tabular-nums md:table-cell md:px-3 md:py-2.5 md:align-top">
                {w.id}
              </td>
              <td
                class={`${Cell} text-xs text-neutral-400 dark:text-neutral-500 tabular-nums md:text-sm md:whitespace-nowrap md:text-inherit`}
              >
                {w.numbers.length > 0 && (
                  <>
                    <span class="md:hidden">{formatSourceNumbers(w.numbers)}</span>
                    <span class="hidden md:inline">{formatSourceNumbers(w.numbers, "")}</span>
                  </>
                )}
              </td>
              <td class={`${Cell} text-base font-semibold md:text-sm md:whitespace-nowrap`}>
                {w.term}
                <SpeakButton audioKey={w.audio_key} label="音声を再生" />
                <FavoriteButton wordId={w.id} favorite={w.favorite} />
                {w.ipa && (
                  <div class="text-sm font-normal text-neutral-500 dark:text-neutral-400">
                    /{w.ipa}/
                  </div>
                )}
              </td>
              <td class={`${Cell} text-neutral-800 dark:text-neutral-100 ${Revealable}`}>
                {w.meaning}
              </td>
              <td class={`${Cell} pt-1.5 md:pt-2.5`}>
                {w.examples.length > 0 && (
                  <Examples examples={w.examples} revealable showSource={false} />
                )}
              </td>
            </tr>
            {groups.length > 0 && (
              <tr class={SubRow}>
                <td class="hidden md:table-cell" colspan={2} />
                <td class={SubCell} colspan={3}>
                  <GroupTags groups={groups} />
                </td>
              </tr>
            )}
          </tbody>
        );
      })}
    </table>
  );
};
