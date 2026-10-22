import type { Group } from "../../backend/db";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { StartDialog } from "../components/start-dialog";
import { startDialogData } from "../helper/start-dialog-data";
import { wordsUrl } from "../helper/words-url";

const Action =
  "flex min-h-11 items-center justify-center rounded-lg bg-blue-50 px-2 text-center text-blue-700";

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
        class="mt-4 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
      >
        <span class="text-lg font-semibold">すべての単語</span>
        <span class="text-sm text-neutral-500">{totalWords} 語</span>
      </a>
      <h2 class="mt-6 text-neutral-500">グループ</h2>
      {groups.length === 0 ? (
        <p class="text-sm text-neutral-500">グループがありません。</p>
      ) : (
        <ul class="my-4 grid gap-3">
          {groups.map((g) => (
            <li class="grid gap-3 rounded-xl bg-white p-4 shadow-sm">
              <div class="grid grid-cols-[1fr_auto] gap-1">
                <span class="text-lg font-semibold">{g.name}</span>
                <span class="text-sm text-neutral-500">{g.word_count} 語</span>
                {g.description && (
                  <span class="col-span-full text-sm text-neutral-500">{g.description}</span>
                )}
              </div>
              <div class="grid grid-cols-3 gap-2 text-sm font-semibold">
                <a href={`/groups/${g.id}?start=0`} {...startDialogData(g)} class={Action}>
                  カード
                </a>
                <a href={wordsUrl({ group: g.id })} class={Action}>
                  単語リスト
                </a>
                <a href={`/groups/${g.id}/tests`} class={Action}>
                  テスト
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      <StartDialog />
    </Layout>
  );
};
