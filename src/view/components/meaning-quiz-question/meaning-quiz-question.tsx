import type { MeaningQuestion } from "../../../backend/meaning-quizzes";
import { FavoriteButton } from "../favorite-button";
import { QuizResults } from "../quiz-results";
import { SpeakButton } from "../speak-button";

type Props = {
  question: MeaningQuestion;
};

const choiceTone = (question: MeaningQuestion, index: number) => {
  if (question.chosen === null) return "bg-white hover:bg-blue-50 cursor-pointer";
  if (index === question.answer) return "bg-green-100 text-green-900 ring-2 ring-green-600";
  if (index === question.chosen) return "bg-red-100 text-red-900 ring-2 ring-red-500";
  return "bg-white text-neutral-500";
};

export const MeaningQuizQuestion = (props: Props) => {
  const { question } = props;
  const answered = question.chosen !== null;
  const correct = question.chosen === question.answer;
  const { attempts, corrects } = question.history;
  return (
    <section
      id={`meaning-question-${question.word_id}`}
      data-result={answered ? (correct ? "correct" : "wrong") : undefined}
      class="rounded-xl bg-white p-4 shadow-sm"
    >
      <div class="mb-2 flex items-center gap-2 text-sm text-neutral-500">
        <span>({question.number})</span>
        {answered && (
          <span class={correct ? "text-green-700" : "text-red-700"}>
            {correct ? "正解" : "不正解"}
          </span>
        )}
        {attempts > 0 && (
          <span class="ml-auto flex items-center gap-2 text-xs">
            <QuizResults history={question.history} />
            これまで {attempts} 回中 {corrects} 回正解
          </span>
        )}
      </div>
      <div class="flex items-center gap-1">
        <span class="text-2xl font-bold">{question.term}</span>
        <SpeakButton audioKey={question.audio_key} label="音声を再生" />
        {answered && <FavoriteButton wordId={question.word_id} favorite={question.favorite} />}
      </div>
      {question.ipa && <div class="text-sm text-neutral-500">/{question.ipa}/</div>}
      <ol class="mt-3 grid grid-cols-2 gap-2">
        {question.choices.map((choice, i) => (
          <li>
            <button
              type="button"
              disabled={answered}
              hx-post={answered ? undefined : `/words/${question.word_id}/meaning-answer`}
              hx-vals={
                answered ? undefined : JSON.stringify({ choice: i, number: question.number })
              }
              hx-target={`#meaning-question-${question.word_id}`}
              hx-swap="outerHTML"
              class={`flex h-full w-full items-baseline gap-2 rounded-lg border border-neutral-200 px-3 py-4 text-left ${choiceTone(question, i)}`}
            >
              <span class="text-neutral-400">{i + 1}</span>
              <span>
                <span class="font-medium">{choice.ja}</span>
                {answered && <span class="ml-2 text-xs text-neutral-500">{choice.en}</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
};
