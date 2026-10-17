import { z } from "zod/mini";
import { clamp } from "remeda";

export const PerPageOptions = [10, 25, 50] as const;
export const DefaultPerPage = 50;

export type Paging = {
  page: number;
  per: number;
  pages: number;
  total: number;
  offset: number;
};

export const coercedInt = (min: number, max = Number.MAX_SAFE_INTEGER) =>
  z.pipe(z.coerce.number(), z.int().check(z.minimum(min), z.maximum(max)));

export const coercedLiteral = <T extends readonly number[]>(values: T, fallback: T[number]) =>
  z.catch(z.pipe(z.coerce.number(), z.literal(values)), fallback);

export const CardFilterSchema = z.catch(z.enum(["all", "favorites"]), "all");

const PagingQuerySchema = z.object({
  page: z.catch(coercedInt(1), 1),
  per: coercedLiteral(PerPageOptions, DefaultPerPage),
});

export const CardQuerySchema = z.object({
  index: z.catch(coercedInt(0), 0),
  total: z.catch(coercedInt(1), 1),
  only: CardFilterSchema,
});

export const PlayerQuerySchema = z.object({
  start: z.pipe(z.string().check(z.regex(/^[0-9]+$/)), z.transform(Number)),
  only: CardFilterSchema,
});

export const GroupFilterSchema = z.catch(z.optional(coercedInt(1)), undefined);

export const resolvePaging = (query: Record<string, string>, total: number): Paging => {
  const { page: requestedPage, per } = PagingQuerySchema.parse(query);
  const pages = clamp(Math.ceil(total / per), { min: 1 });
  const page = clamp(requestedPage, { max: pages });
  return { page, per, pages, total, offset: (page - 1) * per };
};
