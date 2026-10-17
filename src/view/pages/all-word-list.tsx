import type { Group, ListedWord } from "../../backend/db";
import type { Paging } from "../../backend/paging";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { PagedWordTable } from "../components/paged-word-table";

type Props = {
  words: ListedWord[];
  paging: Paging;
  groups: Group[];
  groupId?: number;
};

export const AllWordList = (props: Props) => {
  const { words, paging, groups, groupId } = props;
  return (
    <Layout title="単語リスト - 単語帳" wide>
      <PageHeader title="単語リスト" backHref="/" />
      <PagedWordTable words={words} paging={paging} groups={groups} groupId={groupId} />
    </Layout>
  );
};
