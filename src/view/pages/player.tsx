import type { CardFilter, Group, Word } from "../../backend/db";
import type { Settings } from "../../backend/settings";
import { Deck } from "../components/deck";
import { Layout } from "../components/layout";
import { OfflineSave } from "../components/offline-save";
import { PageHeader } from "../components/page-header";

type Props = {
  group: Group;
  start: number;
  first: Word | null;
  settings: Settings;
  wordIds: number[];
  filter: CardFilter;
};

export const Player = (props: Props) => {
  const { group, start, first, settings, wordIds, filter } = props;
  return (
    <Layout title={`${group.name} - 単語帳`}>
      <PageHeader title={group.name} backHref="/" />
      <Deck
        group={group}
        start={start}
        first={first}
        settings={settings}
        wordIds={wordIds}
        filter={filter}
      />
      {first && <OfflineSave />}
    </Layout>
  );
};
