import type { Group } from "../../backend/db";
import type { PassageSummary } from "../../backend/passages";
import { GroupSummary } from "../components/group-summary";
import { Layout } from "../components/layout";
import { MeaningQuizForm } from "../components/meaning-quiz-form";
import { PageHeader } from "../components/page-header";
import { QuizForm } from "../components/quiz-form";
import { StartDialog } from "../components/start-dialog";
import { TestForm } from "../components/test-form";
import { startDialogData } from "../helper/start-dialog-data";

type Props = {
  group: Group;
  passages: PassageSummary[];
};

export const TestListPage = (props: Props) => {
  const { group, passages } = props;
  return (
    <Layout title={`${group.name} のテスト - 単語帳`}>
      <PageHeader
        title={`${group.name} のテスト`}
        backHref="/"
        link={{
          href: `/groups/${group.id}?start=0`,
          label: "カードで見る",
          data: startDialogData(group),
        }}
      />
      <div class="mt-4 rounded-xl bg-white dark:bg-neutral-800 p-4 shadow-sm">
        <GroupSummary group={group} />
      </div>
      <h2 class="mt-6 font-semibold">4択問題</h2>
      <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        英検1級の大問1形式で、空所に入る語を選びます。
      </p>
      <QuizForm
        groupId={group.id}
        questionCount={group.word_count}
        favoritesCount={group.favorite_count}
      />
      <h2 class="mt-8 font-semibold">意味の4択</h2>
      <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        英単語を見て、日本語の意味を4つから選びます。
      </p>
      <MeaningQuizForm
        groupId={group.id}
        questionCount={group.word_count}
        favoritesCount={group.favorite_count}
      />
      <h2 class="mt-8 font-semibold">英文テスト</h2>
      <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        グループの単語を使った約300語の英文を作ります。太字の単語の意味がわかるか確かめてください。
      </p>
      <TestForm groupId={group.id} favoritesCount={group.favorite_count} />
      <h2 class="mt-6 text-neutral-500 dark:text-neutral-400">これまでのテスト</h2>
      {passages.length === 0 ? (
        <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">まだありません。</p>
      ) : (
        <ul class="mt-2 grid gap-2">
          {passages.map((p) => (
            <li>
              <a
                href={`/tests/${p.id}`}
                class="block rounded-xl bg-white dark:bg-neutral-800 p-4 shadow-sm"
              >
                <span class="block font-semibold">{p.title}</span>
                <span class="text-xs text-neutral-400 dark:text-neutral-500">{p.created_at}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <StartDialog />
    </Layout>
  );
};
