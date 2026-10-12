import type { WordWithGroups } from "../../backend/db";
import { Layout } from "../components/layout";
import { WordRows } from "../components/word-rows";

type Props = {
  words: WordWithGroups[];
};

export const AllWordList = (props: Props) => {
  const { words } = props;
  return (
    <Layout title="すべての単語 - 単語帳">
      <main class="container">
        <header class="player-header">
          <a href="/" class="back-link">
            ← 一覧
          </a>
          <h1>すべての単語</h1>
        </header>
        <WordRows words={words} />
      </main>
    </Layout>
  );
};
