import type { Group, Word } from "../../backend/db";
import type { Settings } from "../../backend/settings";
import { Deck } from "../components/deck";
import { Layout } from "../components/layout";

type Props = {
  group: Group;
  start: number;
  first: Word | null;
  settings: Settings;
};

export const Player = (props: Props) => {
  const { group, start, first, settings } = props;
  return (
    <Layout title={`${group.name} - 単語帳`}>
      <main class="container player">
        <header class="player-header">
          <a href="/" class="back-link">
            ← 一覧
          </a>
          <h1>{group.name}</h1>
          <a href={`/groups/${group.id}/words`} class="header-link">
            単語リスト
          </a>
        </header>
        <Deck group={group} start={start} first={first} settings={settings} />
      </main>
    </Layout>
  );
};
