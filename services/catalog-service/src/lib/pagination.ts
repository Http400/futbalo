import type { PaginationParams, PaginatedResponse } from '@futbalo/types';

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

export function parsePagination(query: Record<string, unknown>):
  | { ok: true; params: PaginationParams }
  | { ok: false; error: string } {
  const rawPage = query['page'];
  const rawLimit = query['limit'];

  const page = rawPage === undefined ? PAGINATION_DEFAULTS.page : Number(rawPage);
  const limit = rawLimit === undefined ? PAGINATION_DEFAULTS.limit : Number(rawLimit);

  if (!Number.isInteger(page) || page < 1) {
    return { ok: false, error: 'page must be a positive integer' };
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > PAGINATION_DEFAULTS.maxLimit) {
    return { ok: false, error: `limit must be an integer between 1 and ${PAGINATION_DEFAULTS.maxLimit}` };
  }

  return { ok: true, params: { page, limit } };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams,
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
