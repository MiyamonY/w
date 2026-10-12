import type { WordWithGroups } from "../../backend/db";
import type { Paging } from "../../backend/paging";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { PagedWordTable } from "../components/paged-word-table";

type Props = {
  words: WordWithGroups[];
  paging: Paging;
};

export const AllWordList = (props: Props) => {
  const { words, paging } = props;
  return (
    <Layout title="すべての単語 - 単語帳" wide>
      <PageHeader title="すべての単語" backHref="/" />
      <PagedWordTable words={words} paging={paging} basePath="/words" />
    </Layout>
  );
};
