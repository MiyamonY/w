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
      {attempts > recent.length && <span class="text-neutral-400">…</span>}
      {recent.map((correct) =>
        correct ? <span class="text-green-700">o</span> : <span class="text-red-600">x</span>,
      )}
    </span>
  );
};
