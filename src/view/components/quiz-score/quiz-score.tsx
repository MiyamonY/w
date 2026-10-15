import type { QuizScore as Score } from "../../../backend/quizzes";

type Props = {
  score: Score;
  oob?: boolean;
};

export const QuizScore = (props: Props) => {
  const { score, oob = false } = props;
  return (
    <div
      id="quiz-score"
      hx-swap-oob={oob ? "true" : undefined}
      class="sticky top-0 z-10 -mx-4 mt-4 bg-neutral-100/90 px-4 py-2 text-sm backdrop-blur"
    >
      正解 <span class="font-semibold">{score.correct}</span> / 解答 {score.answered} / 全{" "}
      {score.total} 問
    </div>
  );
};
