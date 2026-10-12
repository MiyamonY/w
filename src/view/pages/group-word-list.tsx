import type { Group, WordWithGroups } from "../../backend/db";
import type { Paging } from "../../backend/paging";
import { Layout } from "../components/layout";
import { PagedWordTable } from "../components/paged-word-table";

type Props = {
  group: Group;
  words: WordWithGroups[];
  paging: Paging;
};

export const GroupWordList = (props: Props) => {
  const { group, words, paging } = props;
  return (
    <Layout title={`${group.name} - 単語リスト`}>
      <main class="container wide">
        <header class="player-header">
          <a href="/" class="back-link">
            ← 一覧
          </a>
          <h1>{group.name}</h1>
          <a href={`/groups/${group.id}`} class="header-link">
            カードで見る
          </a>
        </header>
        <PagedWordTable
          words={words}
          paging={paging}
          basePath={`/groups/${group.id}/words`}
          cardHref={(i) => `/groups/${group.id}?start=${i}`}
          currentGroupId={group.id}
        />
      </main>
    </Layout>
  );
};
