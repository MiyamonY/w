import type { CardFilter, Group, WordWithGroups } from "../../../backend/db";
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
  filter: CardFilter;
};

export const PagedWordTable = (props: Props) => {
  const { words, paging, groups, groupId, filter } = props;
  const only = filter === "favorites" ? "favorites" : undefined;
  const href = (page: number) => wordsUrl({ group: groupId, only, page, per: paging.per });
  const cardQuery = only ? "&only=favorites" : "";
  return (
    <section
      id="paged-word-table"
      hx-target="this"
      hx-swap="outerHTML show:window:top"
      hx-push-url="true"
    >
      <WordListFilter groups={groups} groupId={groupId} filter={filter} per={paging.per} />
      <Pagination paging={paging} href={href} />
      <WordTable
        words={words}
        cardHref={
          groupId === undefined
            ? undefined
            : (i) => `/groups/${groupId}?start=${paging.offset + i}${cardQuery}`
        }
        currentGroupId={groupId}
      />
      {paging.pages > 1 && <Pagination paging={paging} href={href} />}
    </section>
  );
};
