/**
 * Pagination utilities types for Linkwarden REST API
 *
 * These types support a unified pagination system across all GET endpoints:
 * - Column-based sorting (sort=name,id&dir=asc,desc)
 * - Cursor-based pagination (Prisma native)
 * - Configurable limits with max bounds
 * - Simple search filtering
 */

/**
 * Base pagination parameters that can be included in any GET request
 */
export type PaginationParams = {
  /** Cursor value (typically last item ID from previous page) */
  cursor?: number;

  /** Maximum items to return (subject to maxLimit) */
  limit?: number;

  /** Comma-separated column names (e.g., "name,id") */
  sort?: string;

  /** Comma-separated directions (e.g., "asc,desc") */
  dir?: string;

  /** Search query (meaning depends on endpoint) */
  search?: string;
};

/**
 * Paginated response format
 * Generic type T should extend { id: number }
 */
export type PaginatedResponse<T> = {
  /** Array of results */
  items: T[];

  /** Next cursor value for pagination, or null if no more pages */
  nextCursor: number | null;

  /** Whether there are more results available */
  hasMore: boolean;

  /** Optional total count (expensive for large datasets) */
  total?: number;
};

/**
 * Configuration options for pagination
 */
export type PaginationOptions = {
  /** Default limit when not specified (default: 50) */
  defaultLimit?: number;

  /** Maximum allowed limit (default: 100) */
  maxLimit?: number;

  /** Default sort order if none specified */
  defaultSort?: Array<{ [key: string]: "asc" | "desc" }>;

  /** Whitelist of columns that can be sorted (security) */
  allowedSortColumns?: string[];
};

/**
 * Parsed pagination configuration ready for Prisma
 */
export type ParsedPagination = {
  /** Number of items to fetch */
  take: number;

  /** Number of items to skip (for cursor pagination, always 1 or undefined) */
  skip?: number;

  /** Cursor object for Prisma (e.g., { id: 123 }) */
  cursor?: { id: number };

  /** Prisma orderBy array */
  orderBy: Array<{ [key: string]: "asc" | "desc" }>;
};

/**
 * Extended pagination params for tags endpoint
 */
export type TagPaginationParams = PaginationParams & {
  /** Filter tags by collection ID */
  collectionId?: number;

  /** User ID (passed separately, not from query params) */
  userId?: number;
};

/**
 * Extended pagination params for collections endpoint
 */
export type CollectionPaginationParams = PaginationParams & {
  /** User ID (passed separately, not from query params) */
  userId?: number;
};

/**
 * Extended pagination params for users endpoint (admin only)
 */
export type UserPaginationParams = PaginationParams & {
  /** Current user (passed separately, not from query params) */
  currentUser?: any; // User type from Prisma
};

/**
 * Extended pagination params for tokens endpoint
 */
export type TokenPaginationParams = PaginationParams & {
  /** User ID (passed separately, not from query params) */
  userId?: number;
};

/**
 * Extended pagination params for highlights endpoint
 */
export type HighlightPaginationParams = PaginationParams & {
  /** User ID (passed separately, not from query params) */
  userId?: number;

  /** Link ID to get highlights for */
  linkId?: number;
};
