type Props = {
  results: boolean[];
};

const MaxShown = 10;

export const QuizResults = (props: Props) => {
  const { results } = props;
  if (results.length === 0) return null;
  const shown = results.slice(-MaxShown);
  return (
    <span
      class="font-mono tracking-wider whitespace-nowrap"
      title={`4択 ${results.length} 回中 ${results.filter(Boolean).length} 回正解`}
    >
      {results.length > MaxShown && <span class="text-neutral-400">…</span>}
      {shown.map((correct) =>
        correct ? <span class="text-green-700">o</span> : <span class="text-red-600">x</span>,
      )}
    </span>
  );
};
