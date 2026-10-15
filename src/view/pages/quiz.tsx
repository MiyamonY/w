import { type Quiz, scoreOf } from "../../backend/quizzes";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { QuizQuestion } from "../components/quiz-question";
import { QuizScore } from "../components/quiz-score";

type Props = {
  quiz: Quiz;
};

export const QuizPage = (props: Props) => {
  const { quiz } = props;
  return (
    <Layout title={`${quiz.group_name} の4択問題 - 単語帳`}>
      <PageHeader
        title={`${quiz.group_name} の4択問題`}
        backHref={`/groups/${quiz.group_id}/tests`}
      />
      <QuizScore score={scoreOf(quiz.questions)} />
      <div class="mt-2 grid gap-3">
        {quiz.questions.map((q) => (
          <QuizQuestion quizId={quiz.id} question={q} />
        ))}
      </div>
    </Layout>
  );
};
