export const PerPageOptions = [10, 50, 100, 500] as const;
export const DefaultPerPage = 50;

export type Paging = {
  page: number;
  per: number;
  pages: number;
  total: number;
  offset: number;
};

export const resolvePaging = (query: { page?: string; per?: string }, total: number): Paging => {
  const requestedPer = Number(query.per);
  const per = PerPageOptions.some((n) => n === requestedPer) ? requestedPer : DefaultPerPage;
  const pages = Math.max(1, Math.ceil(total / per));
  const requestedPage = Math.floor(Number(query.page));
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), pages) : 1;
  return { page, per, pages, total, offset: (page - 1) * per };
};
