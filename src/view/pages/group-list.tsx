import type { Group } from "../../backend/db";
import { Layout } from "../components/layout";

type Props = {
  groups: Group[];
  totalWords: number;
};

export const GroupList = (props: Props) => {
  const { groups, totalWords } = props;
  return (
    <Layout title="単語帳">
      <main class="container">
        <header class="player-header">
          <h1>単語帳</h1>
          <a href="/settings" class="header-link">
            設定
          </a>
        </header>
        <a href="/words" class="all-words">
          <span class="group-name">すべての単語</span>
          <span class="muted">{totalWords} 語</span>
        </a>
        <h2>グループ</h2>
        {groups.length === 0 ? (
          <p class="muted">グループがありません。</p>
        ) : (
          <ul class="groups">
            {groups.map((g) => (
              <li>
                <a href={`/groups/${g.id}`} class="group-main">
                  <span class="group-name">{g.name}</span>
                  <span class="muted">{g.word_count} 語</span>
                  {g.description && <span class="group-desc">{g.description}</span>}
                </a>
                <a href={`/groups/${g.id}/words`} class="group-list-link">
                  単語リスト
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </Layout>
  );
};
