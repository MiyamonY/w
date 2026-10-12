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
      <a href={href(target)} hx-get={href(target)} aria-label={ariaLabel}>
        {label}
      </a>
    ) : (
      <span class="disabled" aria-hidden="true">
        {label}
      </span>
    );
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + per, total);

  return (
    <nav class="pagination">
      <span class="pagination-summary">
        {total} 語中 {from}〜{to}
      </span>
      <div class="pagination-pages">
        {link(1, "«", "最初のページ")}
        {link(page - 1, "‹", "前のページ")}
        <span class="pagination-current">
          {page} / {pages}
        </span>
        {link(page + 1, "›", "次のページ")}
        {link(pages, "»", "最後のページ")}
      </div>
      <form
        class="pagination-per"
        method="get"
        action={basePath}
        hx-get={basePath}
        hx-trigger="change"
      >
        <label>
          表示件数
          <select name="per">
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
