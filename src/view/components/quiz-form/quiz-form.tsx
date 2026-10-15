import { DefaultQuizQuestionCount, QuizQuestionCounts } from "../../../backend/quizzes";

type Props = {
  groupId: number;
  questionCount: number;
  favoritesCount: number;
  error?: string;
};

export const QuizForm = (props: Props) => {
  const { groupId, questionCount, favoritesCount, error } = props;
  return (
    <form
      method="post"
      action={`/groups/${groupId}/quizzes`}
      hx-post={`/groups/${groupId}/quizzes`}
      hx-target="this"
      hx-swap="outerHTML"
      hx-disabled-elt="find button"
      class="mt-4 grid gap-3 rounded-xl bg-white p-5 shadow-sm"
    >
      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-1.5">
          出題数
          <select name="count" class="rounded-md border border-neutral-300 bg-white p-1">
            {QuizQuestionCounts.map((n) => (
              <option value={String(n)} selected={n === DefaultQuizQuestionCount}>
                {n} 問
              </option>
            ))}
          </select>
        </label>
        {favoritesCount > 0 && (
          <label class="flex items-center gap-1.5">
            <input type="checkbox" name="only" value="favorites" />
            お気に入りから出題
          </label>
        )}
        <span class="text-sm text-neutral-500">問題のある単語 {questionCount} 語</span>
      </div>
      <div>
        <button
          type="submit"
          disabled={questionCount === 0}
          class="cursor-pointer rounded-full bg-blue-700 px-6 py-2.5 text-white disabled:opacity-50"
        >
          4択問題を始める
        </button>
      </div>
      {error && <p class="text-sm text-red-700">{error}</p>}
    </form>
  );
};
