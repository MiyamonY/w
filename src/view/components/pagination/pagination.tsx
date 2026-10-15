import { clamp } from "remeda";
import type { Paging } from "../../../backend/paging";

type Props = {
  paging: Paging;
  href: (page: number) => string;
};

export const Pagination = (props: Props) => {
  const { paging, href } = props;
  const { page, pages, per, total, offset } = paging;
  const link = (target: number, label: string, ariaLabel: string) =>
    target >= 1 && target <= pages && target !== page ? (
      <a
        href={href(target)}
        hx-get={href(target)}
        aria-label={ariaLabel}
        class="min-w-8 rounded-md bg-white px-2 py-1 text-center text-blue-700 shadow-sm"
      >
        {label}
      </a>
    ) : (
      <span class="min-w-8 px-2 py-1 text-center text-neutral-300" aria-hidden="true">
        {label}
      </span>
    );
  const from = total === 0 ? 0 : offset + 1;
  const to = clamp(offset + per, { max: total });

  return (
    <nav class="my-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span class="text-neutral-500">
        {total} 語中 {from}〜{to}
      </span>
      <div class="flex items-center gap-1">
        {link(1, "«", "最初のページ")}
        {link(page - 1, "‹", "前のページ")}
        <span class="px-2">
          {page} / {pages}
        </span>
        {link(page + 1, "›", "次のページ")}
        {link(pages, "»", "最後のページ")}
      </div>
    </nav>
  );
};
