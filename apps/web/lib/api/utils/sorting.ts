/**
 * Sorting utilities for column-based sorting
 *
 * Supports:
 * - Multi-column sorting: sort=name,id&dir=asc,desc
 * - Single column: sort=name&dir=asc
 * - Default ascending: sort=name (no dir)
 * - Column whitelisting for security
 * - Legacy enum compatibility
 */

/**
 * Parse sort and dir parameters into Prisma orderBy format
 *
 * @param sort - Comma-separated column names (e.g., "name,id")
 * @param dir - Comma-separated directions (e.g., "asc,desc")
 * @param allowedColumns - Whitelist of sortable columns (security)
 * @param defaultSort - Default sort if none provided
 * @returns Prisma orderBy array
 *
 * @example
 * parseSort("name,id", "asc,desc", ["name", "id", "createdAt"])
 * // Returns: [{ name: 'asc' }, { id: 'desc' }]
 *
 * @example
 * parseSort("name", undefined, ["name", "id"])
 * // Returns: [{ name: 'asc' }, { id: 'desc' }] (id added for stability)
 *
 * @example
 * parseSort("name,id,createdAt", "asc,desc", ["name", "id"])
 * // Returns: [{ name: 'asc' }, { id: 'desc' }] (createdAt filtered out)
 */
export function parseSort(
  sort?: string,
  dir?: string,
  allowedColumns?: string[],
  defaultSort: Array<{ [key: string]: "asc" | "desc" }> = [{ id: "desc" }]
): Array<{ [key: string]: "asc" | "desc" }> {
  if (!sort) {
    return ensureIdInSort(defaultSort);
  }

  const columns = sort
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const directions = dir
    ? dir
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
    : [];

  const result: Array<{ [key: string]: "asc" | "desc" }> = [];

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];

    // Security: Only allow whitelisted columns
    if (allowedColumns && !allowedColumns.includes(column)) {
      continue; // Skip invalid columns
    }

    // Get direction: use index if available, otherwise use last, otherwise default to 'asc'
    let direction = directions[i] || directions[directions.length - 1] || "asc";

    // Validate direction
    if (direction !== "asc" && direction !== "desc") {
      direction = "asc"; // Fallback to asc for invalid directions
    }

    result.push({ [column]: direction as "asc" | "desc" });
  }

  // If no valid columns after filtering, use default
  if (result.length === 0) {
    return ensureIdInSort(defaultSort);
  }

  // Always add id as final sort for cursor stability
  return ensureIdInSort(result);
}

/**
 * Ensure 'id' is included in sort order for cursor stability
 *
 * If sorting by non-unique column (e.g., name), we need id as secondary sort
 * to ensure stable cursor pagination (no skipped/duplicate records)
 *
 * @param orderBy - Current orderBy array
 * @returns orderBy with id added if not present
 */
function ensureIdInSort(
  orderBy: Array<{ [key: string]: "asc" | "desc" }>
): Array<{ [key: string]: "asc" | "desc" }> {
  const hasId = orderBy.some((o) => "id" in o);

  if (!hasId) {
    return [...orderBy, { id: "desc" }];
  }

  return orderBy;
}

/**
 * Parse legacy enum-based sort values for backward compatibility
 *
 * Supports migration from old enum-based sorting:
 * - 0: DateNewestFirst (id desc)
 * - 1: DateOldestFirst (id asc)
 * - 2: NameAZ (name asc)
 * - 3: NameZA (name desc)
 *
 * @param sort - Either enum number or column-based string
 * @param dir - Comma-separated directions (for column-based)
 * @param allowedColumns - Whitelist for column-based sorting
 * @returns Prisma orderBy array
 *
 * @example
 * parseSortWithLegacy(0) // Returns: [{ id: 'desc' }]
 * parseSortWithLegacy("name", "asc") // Returns: [{ name: 'asc' }, { id: 'desc' }]
 */
export function parseSortWithLegacy(
  sort?: string | number,
  dir?: string,
  allowedColumns?: string[]
): Array<{ [key: string]: "asc" | "desc" }> {
  // Check if it's a legacy enum value
  if (typeof sort === "number" || (sort && !isNaN(Number(sort)))) {
    const enumValue = Number(sort);
    switch (enumValue) {
      case 0: // DateNewestFirst
        return [{ id: "desc" }];
      case 1: // DateOldestFirst
        return [{ id: "asc" }];
      case 2: // NameAZ
        return [{ name: "asc" }, { id: "desc" }];
      case 3: // NameZA
        return [{ name: "desc" }, { id: "desc" }];
      default:
        return [{ id: "desc" }];
    }
  }

  // Use new column-based parsing
  return parseSort(sort as string, dir, allowedColumns);
}

/**
 * Convert Prisma orderBy to SQL-like string for debugging/logging
 *
 * @param orderBy - Prisma orderBy array
 * @returns Human-readable sort string (e.g., "name ASC, id DESC")
 *
 * @example
 * orderByToString([{ name: 'asc' }, { id: 'desc' }])
 * // Returns: "name ASC, id DESC"
 */
export function orderByToString(
  orderBy: Array<{ [key: string]: "asc" | "desc" }>
): string {
  return orderBy
    .map((o) => {
      const [key, dir] = Object.entries(o)[0];
      return `${key} ${dir.toUpperCase()}`;
    })
    .join(", ");
}
