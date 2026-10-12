import type { WordWithGroups } from "../../../backend/db";
import type { Paging } from "../../../backend/paging";
import { Pagination } from "../pagination";
import { WordTable } from "../word-table";

type Props = {
  words: WordWithGroups[];
  paging: Paging;
  basePath: string;
  cardHref?: (index: number) => string;
  currentGroupId?: number;
};

export const PagedWordTable = (props: Props) => {
  const { words, paging, basePath, cardHref, currentGroupId } = props;
  return (
    <section id="paged-word-table" hx-target="this" hx-swap="outerHTML" hx-push-url="true">
      <Pagination paging={paging} basePath={basePath} />
      <WordTable
        words={words}
        cardHref={cardHref && ((i) => cardHref(paging.offset + i))}
        currentGroupId={currentGroupId}
      />
      {paging.pages > 1 && <Pagination paging={paging} basePath={basePath} />}
    </section>
  );
};
