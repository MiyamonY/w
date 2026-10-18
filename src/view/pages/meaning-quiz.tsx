import type { Group } from "../../backend/db";
import type { MeaningQuestion } from "../../backend/meaning-quizzes";
import { BackToTests } from "../components/back-to-tests";
import { Layout } from "../components/layout";
import { MeaningQuizQuestion } from "../components/meaning-quiz-question";
import { PageHeader } from "../components/page-header";
import { QuizScore } from "../components/quiz-score";

type Props = {
  group: Group;
  questions: MeaningQuestion[];
};

export const MeaningQuizPage = (props: Props) => {
  const { group, questions } = props;
  return (
    <Layout title={`${group.name} の意味の4択 - 単語帳`}>
      <PageHeader title={`${group.name} の意味の4択`} backHref={`/groups/${group.id}/tests`} />
      <QuizScore total={questions.length} />
      <div class="mt-2 grid gap-3">
        {questions.map((q) => (
          <MeaningQuizQuestion question={q} />
        ))}
      </div>
      <BackToTests groupId={group.id} />
    </Layout>
  );
};
