import type { Group } from "../../backend/db";
import type { PassageSummary } from "../../backend/passages";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { TestForm } from "../components/test-form";

type Props = {
  group: Group;
  favoritesCount: number;
  passages: PassageSummary[];
};

export const TestListPage = (props: Props) => {
  const { group, favoritesCount, passages } = props;
  return (
    <Layout title={`${group.name} のテスト - 単語帳`}>
      <PageHeader
        title={`${group.name} のテスト`}
        backHref="/"
        link={{ href: `/groups/${group.id}`, label: "カードで見る" }}
      />
      <p class="mt-4 text-sm text-neutral-500">
        グループの単語を使った約300語の英文を作ります。太字の単語の意味がわかるか確かめてください。
      </p>
      <TestForm groupId={group.id} favoritesCount={favoritesCount} />
      <h2 class="mt-6 text-neutral-500">これまでのテスト</h2>
      {passages.length === 0 ? (
        <p class="mt-2 text-sm text-neutral-500">まだありません。</p>
      ) : (
        <ul class="mt-2 grid gap-2">
          {passages.map((p) => (
            <li>
              <a
                href={`/tests/${p.id}`}
                class="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm"
              >
                <span>
                  <span class="block font-semibold">{p.title}</span>
                  <span class="text-xs text-neutral-400">{p.created_at}</span>
                </span>
                <span class="shrink-0 text-sm text-neutral-500">
                  確認 {p.revealed_count} / {p.word_count}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
};
