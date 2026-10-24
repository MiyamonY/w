import type { QuizQuestion as Question } from "../../../backend/quizzes";
import { FavoriteButton } from "../favorite-button";
import { QuizResults } from "../quiz-results";
import { SpeakButton } from "../speak-button";

type Props = {
  question: Question;
};

const Blank = "(   )";

const choiceTone = (question: Question, index: number) => {
  if (question.chosen === null) return "bg-white hover:bg-blue-50 cursor-pointer";
  if (index === question.answer) return "bg-green-100 text-green-900 ring-2 ring-green-600";
  if (index === question.chosen) return "bg-red-100 text-red-900 ring-2 ring-red-500";
  return "bg-white text-neutral-500";
};

const Sentence = (props: { question: Question }) => {
  const { question } = props;
  const [before, after = ""] = question.sentence.split(Blank);
  const filled = question.chosen === null ? null : question.choices[question.answer].en;
  return (
    <p class="leading-relaxed">
      {before}
      {filled ? (
        <span class="font-bold text-green-800 underline">{filled}</span>
      ) : (
        <span class="inline-block w-16 border-b border-neutral-500" />
      )}
      {after}
    </p>
  );
};

export const QuizQuestion = (props: Props) => {
  const { question } = props;
  const answered = question.chosen !== null;
  const correct = question.chosen === question.answer;
  const { attempts, corrects } = question.history;
  return (
    <section
      id={`question-${question.word_id}`}
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
      <Sentence question={question} />
      <ol class="mt-3 grid grid-cols-2 gap-2">
        {question.choices.map((choice, i) => (
          <li>
            <button
              type="button"
              disabled={answered}
              hx-post={answered ? undefined : `/words/${question.word_id}/cloze-answer`}
              hx-vals={
                answered ? undefined : JSON.stringify({ choice: i, number: question.number })
              }
              hx-target={`#question-${question.word_id}`}
              hx-swap="outerHTML"
              class={`flex h-full w-full items-baseline gap-2 rounded-lg border border-neutral-200 px-3 py-4 text-left ${choiceTone(question, i)}`}
            >
              <span class="text-neutral-400">{i + 1}</span>
              <span>
                <span class="font-medium">{choice.en}</span>
                {answered && <span class="ml-2 text-xs text-neutral-500">{choice.ja}</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {answered && (
        <div class="mt-3 grid gap-1 border-t border-neutral-100 pt-3 text-sm">
          <p>{question.translation}</p>
          <p class="text-neutral-600">{question.explanation}</p>
          <div class="flex items-center gap-1 text-neutral-700">
            <span class="font-semibold">{question.term}</span>
            <SpeakButton audioKey={question.audio_key} label="音声を再生" />
            <FavoriteButton wordId={question.word_id} favorite={question.favorite} />
            <span>{question.meaning}</span>
          </div>
        </div>
      )}
    </section>
  );
};
