import { clamp, range } from "remeda";
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
        class="min-w-8 rounded-md bg-white dark:bg-neutral-800 px-2 py-1 text-center text-blue-700 dark:text-blue-400 shadow-sm"
      >
        {label}
      </a>
    ) : (
      <span
        class="min-w-8 px-2 py-1 text-center text-neutral-300 dark:text-neutral-600"
        aria-hidden="true"
      >
        {label}
      </span>
    );
  const from = total === 0 ? 0 : offset + 1;
  const to = clamp(offset + per, { max: total });
  const [action, search] = href(page).split("?");
  const hidden = [...new URLSearchParams(search)].filter(([name]) => name !== "page");

  return (
    <nav class="my-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span class="text-neutral-500 dark:text-neutral-400">
        {total} 語中 {from}〜{to}
      </span>
      <div class="flex items-center gap-1">
        {link(1, "«", "最初のページ")}
        {link(page - 1, "‹", "前のページ")}
        <form
          method="get"
          action={action}
          hx-get={action}
          hx-trigger="change"
          class="flex items-center gap-1 px-1"
        >
          {hidden.map(([name, value]) => (
            <input type="hidden" name={name} value={value} />
          ))}
          <select
            name="page"
            aria-label="ページ番号"
            class="rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-1"
          >
            {range(1, pages + 1).map((n) => (
              <option value={String(n)} selected={n === page}>
                {n}
              </option>
            ))}
          </select>
          <span>/ {pages}</span>
          <noscript>
            <button
              type="submit"
              class="rounded-md bg-white dark:bg-neutral-800 px-2 py-1 shadow-sm"
            >
              移動
            </button>
          </noscript>
        </form>
        {link(page + 1, "›", "次のページ")}
        {link(pages, "»", "最後のページ")}
      </div>
    </nav>
  );
};
