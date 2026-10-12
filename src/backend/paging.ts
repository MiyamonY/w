import { z } from "zod";

export const PerPageOptions = [10, 50, 100, 500] as const;
export const DefaultPerPage = 50;

export type Paging = {
  page: number;
  per: number;
  pages: number;
  total: number;
  offset: number;
};

const PagingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  per: z.coerce.number().pipe(z.literal(PerPageOptions)).catch(DefaultPerPage),
});

export const StartIndexSchema = z.coerce.number().int().min(0).catch(0);

export const GroupFilterSchema = z.coerce.number().int().positive().optional().catch(undefined);

export const resolvePaging = (query: Record<string, string>, total: number): Paging => {
  const { page: requestedPage, per } = PagingQuerySchema.parse(query);
  const pages = Math.max(1, Math.ceil(total / per));
  const page = Math.min(requestedPage, pages);
  return { page, per, pages, total, offset: (page - 1) * per };
};
