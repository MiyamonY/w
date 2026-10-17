import type { Group, WordWithGroups } from "../../../backend/db";
import type { Paging } from "../../../backend/paging";
import { wordsUrl } from "../../helper/words-url";
import { Pagination } from "../pagination";
import { WordListFilter } from "../word-list-filter";
import { WordTable } from "../word-table";

type Props = {
  words: WordWithGroups[];
  paging: Paging;
  groups: Group[];
  groupId?: number;
};

export const PagedWordTable = (props: Props) => {
  const { words, paging, groups, groupId } = props;
  const href = (page: number) => wordsUrl({ group: groupId, page, per: paging.per });
  return (
    <section
      id="paged-word-table"
      hx-target="this"
      hx-swap="outerHTML show:window:top"
      hx-push-url="true"
    >
      <WordListFilter groups={groups} groupId={groupId} per={paging.per} />
      <Pagination paging={paging} href={href} />
      <WordTable
        words={words}
        cardHref={
          groupId === undefined ? undefined : (i) => `/groups/${groupId}?start=${paging.offset + i}`
        }
        currentGroupId={groupId}
      />
      {paging.pages > 1 && <Pagination paging={paging} href={href} />}
    </section>
  );
};
