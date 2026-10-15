import { z } from "zod";
import { clamp } from "remeda";

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

export const CardFilterSchema = z.enum(["all", "favorites"]).catch("all");

export const GroupFilterSchema = z.coerce.number().int().positive().optional().catch(undefined);

export const resolvePaging = (query: Record<string, string>, total: number): Paging => {
  const { page: requestedPage, per } = PagingQuerySchema.parse(query);
  const pages = clamp(Math.ceil(total / per), { min: 1 });
  const page = clamp(requestedPage, { max: pages });
  return { page, per, pages, total, offset: (page - 1) * per };
};
