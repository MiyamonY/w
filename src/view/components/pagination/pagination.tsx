import { PerPageOptions, type Paging } from "../../../backend/paging";

type Props = {
  paging: Paging;
  basePath: string;
};

export const Pagination = (props: Props) => {
  const { paging, basePath } = props;
  const { page, pages, per, total, offset } = paging;
  const href = (target: number) => `${basePath}?page=${target}&per=${per}`;
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
  const to = Math.min(offset + per, total);

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
      <form method="get" action={basePath} hx-get={basePath} hx-trigger="change">
        <label>
          表示件数
          <select name="per" class="ml-1.5 rounded-md border border-neutral-300 bg-white p-1">
            {PerPageOptions.map((n) => (
              <option value={String(n)} selected={n === per}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </form>
    </nav>
  );
};
