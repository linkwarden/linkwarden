/**
 * Pagination utilities for Linkwarden REST API
 *
 * Provides reusable functions for:
 * - Parsing pagination parameters from request queries
 * - Building paginated responses with nextCursor
 * - Complete pagination helper (parse + execute + format)
 */

import {
  PaginationParams,
  PaginationOptions,
  ParsedPagination,
  PaginatedResponse,
} from './types';
import { parseSort } from './sorting';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Parse pagination parameters from request query
 *
 * Converts query parameters into Prisma-ready pagination config:
 * - Validates and bounds limit (default 50, max 100)
 * - Parses cursor for ID-based pagination
 * - Parses sort/dir into Prisma orderBy
 * - Validates columns against whitelist
 *
 * @param params - Query parameters from request
 * @param options - Pagination configuration options
 * @returns Parsed pagination ready for Prisma
 *
 * @example
 * const pagination = parsePagination(req.query, {
 *   defaultLimit: 20,
 *   maxLimit: 50,
 *   allowedSortColumns: ['name', 'id', 'createdAt']
 * });
 *
 * const results = await prisma.tag.findMany({
 *   take: pagination.take,
 *   skip: pagination.skip,
 *   cursor: pagination.cursor,
 *   orderBy: pagination.orderBy,
 * });
 */
export function parsePagination(
  params: PaginationParams,
  options: PaginationOptions = {}
): ParsedPagination {
  const {
    defaultLimit = DEFAULT_LIMIT,
    maxLimit = MAX_LIMIT,
    defaultSort = [{ id: 'desc' }],
    allowedSortColumns,
  } = options;

  // Parse limit
  let limit = defaultLimit;
  if (params.limit !== undefined) {
    const parsed = Number(params.limit);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, maxLimit);
    }
  }

  // Parse cursor
  const cursor = params.cursor !== undefined ? Number(params.cursor) : undefined;

  // Validate cursor is a valid number
  if (cursor !== undefined && (isNaN(cursor) || cursor < 0)) {
    throw new Error('Invalid cursor value');
  }

  // Parse sort
  const orderBy = parseSort(
    params.sort,
    params.dir,
    allowedSortColumns,
    defaultSort
  );

  return {
    take: limit,
    skip: cursor ? 1 : undefined, // Skip 1 for cursor-based (cursor is inclusive)
    cursor: cursor ? { id: cursor } : undefined,
    orderBy,
  };
}

/**
 * Build paginated response with next cursor
 *
 * Determines if there are more results and calculates nextCursor:
 * - If items.length === limit, there might be more (hasMore = true)
 * - nextCursor is the ID of the last item
 * - If items.length < limit, no more results (hasMore = false, nextCursor = null)
 *
 * @param items - Array of results from database
 * @param limit - The limit used in the query
 * @returns Paginated response object
 *
 * @example
 * const pagination = parsePagination(req.query);
 * const tags = await prisma.tag.findMany({ ...pagination });
 * const response = buildPaginatedResponse(tags, pagination.take);
 *
 * return res.json({
 *   success: true,
 *   response: response,
 * });
 */
export function buildPaginatedResponse<T extends { id: number }>(
  items: T[],
  limit: number
): PaginatedResponse<T> {
  const hasMore = items.length === limit;
  const nextCursor = hasMore && items.length > 0
    ? items[items.length - 1].id
    : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

/**
 * Complete pagination helper - parse params and execute query
 *
 * Combines parsePagination, query execution, and buildPaginatedResponse
 * into a single convenient function.
 *
 * @param params - Request query parameters
 * @param queryFn - Function that takes pagination config and returns results
 * @param options - Pagination options
 * @returns Paginated response
 *
 * @example
 * // In getTags controller
 * const result = await paginate(
 *   req.query,
 *   async (config) => {
 *     return await prisma.tag.findMany({
 *       ...config,
 *       where: { ownerId: userId },
 *       include: { _count: { select: { links: true } } },
 *     });
 *   },
 *   { allowedSortColumns: ['name', 'id', 'createdAt'] }
 * );
 *
 * return res.json({ success: true, response: result });
 */
export async function paginate<T extends { id: number }>(
  params: PaginationParams,
  queryFn: (config: ParsedPagination) => Promise<T[]>,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<T>> {
  const pagination = parsePagination(params, options);
  const items = await queryFn(pagination);
  return buildPaginatedResponse(items, pagination.take);
}

/**
 * Build paginated response with total count (expensive!)
 *
 * Only use when total count is explicitly needed.
 * For large datasets (>1000 records), counting can be slow.
 *
 * @param items - Array of results from database
 * @param limit - The limit used in the query
 * @param total - Total count from separate count query
 * @returns Paginated response with total
 *
 * @example
 * const [items, total] = await Promise.all([
 *   prisma.tag.findMany({ ...pagination }),
 *   prisma.tag.count({ where: { ownerId: userId } })
 * ]);
 *
 * const response = buildPaginatedResponseWithCount(items, pagination.take, total);
 */
export function buildPaginatedResponseWithCount<T extends { id: number }>(
  items: T[],
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    ...buildPaginatedResponse(items, limit),
    total,
  };
}
