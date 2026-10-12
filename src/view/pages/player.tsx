import type { Group, Word } from "../../backend/db";
import type { Settings } from "../../backend/settings";
import { Deck } from "../components/deck";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";

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
      <PageHeader
        title={group.name}
        backHref="/"
        link={{ href: `/groups/${group.id}/words`, label: "単語リスト" }}
      />
      <Deck group={group} start={start} first={first} settings={settings} />
    </Layout>
  );
};
