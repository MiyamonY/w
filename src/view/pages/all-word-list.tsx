import type { WordWithGroups } from "../../backend/db";
import type { Paging } from "../../backend/paging";
import { Layout } from "../components/layout";
import { PagedWordTable } from "../components/paged-word-table";

type Props = {
  words: WordWithGroups[];
  paging: Paging;
};

export const AllWordList = (props: Props) => {
  const { words, paging } = props;
  return (
    <Layout title="すべての単語 - 単語帳">
      <main class="container wide">
        <header class="player-header">
          <a href="/" class="back-link">
            ← 一覧
          </a>
          <h1>すべての単語</h1>
        </header>
        <PagedWordTable words={words} paging={paging} basePath="/words" />
      </main>
    </Layout>
  );
};
