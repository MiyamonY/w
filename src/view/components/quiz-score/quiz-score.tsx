type Props = {
  total: number;
};

export const QuizScore = (props: Props) => {
  const { total } = props;
  return (
    <div
      id="quiz-score"
      class="sticky top-0 z-10 -mx-4 mt-4 bg-neutral-100/90 px-4 py-2 text-sm backdrop-blur"
    >
      正解{" "}
      <span data-score="correct" class="font-semibold">
        0
      </span>{" "}
      / 解答 <span data-score="answered">0</span> / 全 {total} 問
    </div>
  );
};
