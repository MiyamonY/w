import type { QuestionHistory } from "../../../backend/quizzes";

type Props = {
  history: QuestionHistory;
};

export const QuizResults = (props: Props) => {
  const { attempts, corrects, recent } = props.history;
  if (attempts === 0) return null;
  return (
    <span
      class="font-mono tracking-wider whitespace-nowrap"
      title={`${attempts} 回中 ${corrects} 回正解`}
    >
      {attempts > recent.length && <span class="text-neutral-400 dark:text-neutral-500">…</span>}
      {recent.map((correct) =>
        correct ? (
          <span class="text-green-700 dark:text-green-400">o</span>
        ) : (
          <span class="text-red-600 dark:text-red-400">x</span>
        ),
      )}
    </span>
  );
};
