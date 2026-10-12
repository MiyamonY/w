import type { Group, WordWithGroups } from "../../backend/db";
import type { Paging } from "../../backend/paging";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { PagedWordTable } from "../components/paged-word-table";

type Props = {
  group: Group;
  words: WordWithGroups[];
  paging: Paging;
};

export const GroupWordList = (props: Props) => {
  const { group, words, paging } = props;
  return (
    <Layout title={`${group.name} - 単語リスト`} wide>
      <PageHeader
        title={group.name}
        backHref="/"
        link={{ href: `/groups/${group.id}`, label: "カードで見る" }}
      />
      <PagedWordTable
        words={words}
        paging={paging}
        basePath={`/groups/${group.id}/words`}
        cardHref={(i) => `/groups/${group.id}?start=${i}`}
        currentGroupId={group.id}
      />
    </Layout>
  );
};
