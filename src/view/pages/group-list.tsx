import type { Group } from "../../backend/db";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { wordsUrl } from "../helper/words-url";

type Props = {
  groups: Group[];
  totalWords: number;
};

export const GroupList = (props: Props) => {
  const { groups, totalWords } = props;
  return (
    <Layout title="単語帳">
      <PageHeader title="単語帳" link={{ href: "/settings", label: "設定" }} />
      <a
        href="/words"
        class="mt-4 flex items-center justify-between rounded-xl bg-blue-700 p-4 text-white"
      >
        <span class="text-lg font-semibold">すべての単語</span>
        <span class="text-sm text-blue-100">{totalWords} 語</span>
      </a>
      <h2 class="mt-6 text-neutral-500">グループ</h2>
      {groups.length === 0 ? (
        <p class="text-sm text-neutral-500">グループがありません。</p>
      ) : (
        <ul class="my-4 grid gap-3">
          {groups.map((g) => (
            <li class="relative">
              <a
                href={`/groups/${g.id}`}
                class="grid grid-cols-[1fr_auto] gap-1 rounded-xl bg-white p-4 pr-28 shadow-sm"
              >
                <span class="text-lg font-semibold">{g.name}</span>
                <span class="text-sm text-neutral-500">{g.word_count} 語</span>
                {g.description && (
                  <span class="col-span-full text-sm text-neutral-500">{g.description}</span>
                )}
              </a>
              <a
                href={wordsUrl({ group: g.id })}
                class="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-blue-700"
              >
                単語リスト
              </a>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
};
