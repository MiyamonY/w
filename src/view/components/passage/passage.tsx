import { parsePassageBody, type Passage as PassageData } from "../../../backend/passages";
import { shortMeaning } from "../../helper/short-meaning";

type Props = {
  passage: PassageData;
};

export const Passage = (props: Props) => {
  const { passage } = props;
  const wordsByNumber = new Map(passage.words.map((w) => [w.number, w]));
  return (
    <article
      id="passage"
      data-meaning="off"
      class="group/passage rounded-xl bg-white dark:bg-neutral-800 p-5 shadow-sm"
    >
      <div class="mb-4 flex items-start justify-between gap-3">
        <h2 class="text-lg font-bold">{passage.title}</h2>
        <button
          id="meaning-toggle"
          type="button"
          class="shrink-0 cursor-pointer rounded-full bg-blue-700 px-4 py-1.5 text-sm text-white"
        >
          意味を表示
        </button>
      </div>
      {parsePassageBody(passage.body).map((paragraph) => (
        <p class="mb-4 leading-loose last:mb-0">
          {paragraph.map((segment) => {
            if ("text" in segment) return segment.text;
            const word = wordsByNumber.get(segment.number);
            if (!word) return segment.form;
            return (
              <span class="group/word" data-word>
                <ruby class="cursor-pointer">
                  <strong class="text-blue-800 dark:text-blue-300 underline decoration-dotted underline-offset-4">
                    {segment.form}
                  </strong>
                  <rt class="invisible text-[0.65em] font-normal text-amber-700 dark:text-amber-400 group-data-[open]/word:visible group-data-[meaning=on]/passage:visible">
                    {shortMeaning(word.meaning)}
                  </rt>
                </ruby>
              </span>
            );
          })}
        </p>
      ))}
    </article>
  );
};
