import type { Group, WordWithGroups } from "../../backend/db";
import { Layout } from "../components/layout";
import { WordRows } from "../components/word-rows";

type Props = {
  group: Group;
  words: WordWithGroups[];
};

export const GroupWordList = (props: Props) => {
  const { group, words } = props;
  return (
    <Layout title={`${group.name} - 単語リスト`}>
      <main class="container">
        <header class="player-header">
          <a href="/" class="back-link">
            ← 一覧
          </a>
          <h1>{group.name}</h1>
          <a href={`/groups/${group.id}`} class="header-link">
            カードで見る
          </a>
        </header>
        <WordRows
          words={words}
          cardHref={(i) => `/groups/${group.id}?start=${i}`}
          currentGroupId={group.id}
        />
      </main>
    </Layout>
  );
};
