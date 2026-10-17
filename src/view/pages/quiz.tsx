import type { Group } from "../../backend/db";
import type { QuizQuestion as Question } from "../../backend/quizzes";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { QuizQuestion } from "../components/quiz-question";
import { QuizScore } from "../components/quiz-score";

type Props = {
  group: Group;
  questions: Question[];
};

export const QuizPage = (props: Props) => {
  const { group, questions } = props;
  return (
    <Layout title={`${group.name} の4択問題 - 単語帳`}>
      <PageHeader title={`${group.name} の4択問題`} backHref={`/groups/${group.id}/tests`} />
      <QuizScore total={questions.length} />
      <div class="mt-2 grid gap-3">
        {questions.map((q) => (
          <QuizQuestion question={q} />
        ))}
      </div>
    </Layout>
  );
};
