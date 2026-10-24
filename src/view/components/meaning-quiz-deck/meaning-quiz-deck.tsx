import type { MeaningQuestion } from "../../../backend/meaning-quizzes";
import { MeaningQuizQuestion } from "../meaning-quiz-question";

type Props = {
  questions: MeaningQuestion[];
  finishHref: string;
};

const NavButton =
  "cursor-pointer py-4 text-3xl text-blue-700 dark:text-blue-400 active:bg-neutral-100 dark:active:bg-neutral-700 disabled:text-neutral-300 dark:disabled:text-neutral-600";

export const MeaningQuizDeck = (props: Props) => {
  const { questions, finishHref } = props;
  const last = questions.length <= 1;
  return (
    <>
      <div id="meaning-quiz-deck" class="mt-2">
        {questions.map((q, i) => (
          <div data-quiz-card hidden={i > 0}>
            <MeaningQuizQuestion question={q} />
          </div>
        ))}
      </div>
      <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur">
        <div class="mx-auto grid max-w-140 grid-cols-3 items-center">
          <button
            type="button"
            data-quiz-nav="prev"
            aria-label="前の問題"
            disabled
            class={NavButton}
          >
            ‹
          </button>
          <span
            id="meaning-quiz-position"
            class="text-center text-sm text-neutral-500 dark:text-neutral-400 tabular-nums"
          >
            1 / {questions.length}
          </span>
          <button
            type="button"
            data-quiz-nav="next"
            data-finish-href={finishHref}
            aria-label={last ? "終了" : "次の問題"}
            class={NavButton}
          >
            <span data-nav-label="next" hidden={last}>
              ›
            </span>
            <span data-nav-label="finish" hidden={!last} class="text-base font-medium">
              終了
            </span>
          </button>
        </div>
      </nav>
      <div class="h-20" aria-hidden="true" />
    </>
  );
};
