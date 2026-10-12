import type { Group, Word } from "../../backend/db";
import type { Settings } from "../../backend/settings";
import { Deck } from "../components/deck";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { wordsUrl } from "../helper/words-url";

type Props = {
  group: Group;
  start: number;
  first: Word | null;
  settings: Settings;
  favoritesCount?: number;
};

export const Player = (props: Props) => {
  const { group, start, first, settings, favoritesCount } = props;
  return (
    <Layout title={`${group.name} - 単語帳`}>
      <PageHeader
        title={group.name}
        backHref="/"
        link={{ href: wordsUrl({ group: group.id }), label: "単語リスト" }}
      />
      <Deck
        group={group}
        start={start}
        first={first}
        settings={settings}
        favoritesCount={favoritesCount}
      />
    </Layout>
  );
};
