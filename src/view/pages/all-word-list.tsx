import type { CardFilter, Group, WordWithGroups } from "../../backend/db";
import type { Paging } from "../../backend/paging";
import { JaToggle } from "../components/ja-toggle";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { PagedWordTable } from "../components/paged-word-table";

type Props = {
  words: WordWithGroups[];
  paging: Paging;
  groups: Group[];
  groupId?: number;
  filter: CardFilter;
};

export const AllWordList = (props: Props) => {
  const { words, paging, groups, groupId, filter } = props;
  return (
    <Layout title="単語リスト - 単語帳" wide>
      <PageHeader title="単語リスト" backHref="/" />
      <JaToggle />
      <div id="word-list" class="group/words">
        <PagedWordTable
          words={words}
          paging={paging}
          groups={groups}
          groupId={groupId}
          filter={filter}
        />
      </div>
    </Layout>
  );
};
