/**
 * Unit tests for pagination utilities
 */

import {
  parsePagination,
  buildPaginatedResponse,
  buildPaginatedResponseWithCount,
  paginate,
} from "../pagination";
import { PaginationParams } from "../types";

describe("parsePagination", () => {
  it("should use default limit when not specified", () => {
    const result = parsePagination({});
    expect(result.take).toBe(50);
    expect(result.skip).toBeUndefined();
    expect(result.cursor).toBeUndefined();
    expect(result.orderBy).toEqual([{ id: "desc" }]);
  });

  it("should respect custom limit", () => {
    const result = parsePagination({ limit: 20 });
    expect(result.take).toBe(20);
  });

  it("should enforce max limit", () => {
    const result = parsePagination({ limit: 200 }, { maxLimit: 100 });
    expect(result.take).toBe(100);
  });

  it("should set cursor correctly", () => {
    const result = parsePagination({ cursor: 42 });
    expect(result.cursor).toEqual({ id: 42 });
    expect(result.skip).toBe(1);
  });

  it("should not skip when no cursor", () => {
    const result = parsePagination({});
    expect(result.skip).toBeUndefined();
  });

  it("should parse sort parameters", () => {
    const result = parsePagination(
      { sort: "name,createdAt", dir: "asc,desc" },
      { allowedSortColumns: ["name", "createdAt", "id"] }
    );
    expect(result.orderBy).toEqual([
      { name: "asc" },
      { createdAt: "desc" },
      { id: "desc" },
    ]);
  });

  it("should use custom default limit", () => {
    const result = parsePagination({}, { defaultLimit: 25 });
    expect(result.take).toBe(25);
  });

  it("should use custom default sort", () => {
    const result = parsePagination(
      {},
      {
        defaultSort: [{ name: "asc" }],
      }
    );
    expect(result.orderBy).toEqual([{ name: "asc" }, { id: "desc" }]);
  });

  it("should throw error for invalid cursor", () => {
    expect(() => parsePagination({ cursor: -5 })).toThrow(
      "Invalid cursor value"
    );
  });

  it("should throw error for NaN cursor", () => {
    expect(() => parsePagination({ cursor: NaN })).toThrow(
      "Invalid cursor value"
    );
  });

  it("should handle zero limit gracefully", () => {
    const result = parsePagination({ limit: 0 });
    expect(result.take).toBe(50); // Falls back to default
  });

  it("should handle negative limit gracefully", () => {
    const result = parsePagination({ limit: -10 });
    expect(result.take).toBe(50); // Falls back to default
  });

  it("should handle string limit", () => {
    const result = parsePagination({ limit: "30" as any });
    expect(result.take).toBe(30);
  });

  it("should handle invalid string limit", () => {
    const result = parsePagination({ limit: "invalid" as any });
    expect(result.take).toBe(50); // Falls back to default
  });
});

describe("buildPaginatedResponse", () => {
  it("should set hasMore true when items equal limit", () => {
    const items = [
      { id: 1, name: "a" },
      { id: 2, name: "b" },
      { id: 3, name: "c" },
    ];
    const result = buildPaginatedResponse(items, 3);

    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe(3);
    expect(result.items).toEqual(items);
  });

  it("should set hasMore false when items less than limit", () => {
    const items = [
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ];
    const result = buildPaginatedResponse(items, 3);

    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBe(null);
    expect(result.items).toEqual(items);
  });

  it("should handle empty results", () => {
    const result = buildPaginatedResponse([], 10);

    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBe(null);
    expect(result.items).toEqual([]);
  });

  it("should set nextCursor to last item id", () => {
    const items = [
      { id: 10, name: "a" },
      { id: 20, name: "b" },
      { id: 30, name: "c" },
    ];
    const result = buildPaginatedResponse(items, 3);

    expect(result.nextCursor).toBe(30);
  });

  it("should handle single item", () => {
    const items = [{ id: 42, name: "answer" }];
    const result = buildPaginatedResponse(items, 10);

    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBe(null);
    expect(result.items.length).toBe(1);
  });

  it("should handle exactly limit items", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `item${i}`,
    }));
    const result = buildPaginatedResponse(items, 50);

    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe(50);
    expect(result.items.length).toBe(50);
  });
});

describe("buildPaginatedResponseWithCount", () => {
  it("should include total count", () => {
    const items = [
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ];
    const result = buildPaginatedResponseWithCount(items, 10, 150);

    expect(result.total).toBe(150);
    expect(result.hasMore).toBe(false);
    expect(result.items).toEqual(items);
  });

  it("should work with hasMore true", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `item${i}`,
    }));
    const result = buildPaginatedResponseWithCount(items, 10, 100);

    expect(result.total).toBe(100);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe(10);
  });
});

describe("paginate", () => {
  it("should combine parsing, query, and response building", async () => {
    const mockData = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];

    const queryFn = jest.fn().mockResolvedValue(mockData);

    const result = await paginate({ limit: 10 }, queryFn, {
      defaultSort: [{ name: "asc" }],
    });

    expect(queryFn).toHaveBeenCalledWith({
      take: 10,
      skip: undefined,
      cursor: undefined,
      orderBy: [{ name: "asc" }, { id: "desc" }],
    });

    expect(result.items).toEqual(mockData);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBe(null);
  });

  it("should pass pagination config to query function", async () => {
    const queryFn = jest.fn().mockResolvedValue([]);

    await paginate(
      {
        cursor: 42,
        limit: 20,
        sort: "name",
        dir: "asc",
      },
      queryFn,
      { allowedSortColumns: ["name", "id"] }
    );

    expect(queryFn).toHaveBeenCalledWith({
      take: 20,
      skip: 1,
      cursor: { id: 42 },
      orderBy: [{ name: "asc" }, { id: "desc" }],
    });
  });

  it("should handle query function errors", async () => {
    const queryFn = jest.fn().mockRejectedValue(new Error("Database error"));

    await expect(paginate({ limit: 10 }, queryFn)).rejects.toThrow(
      "Database error"
    );
  });

  it("should correctly detect hasMore with full page", async () => {
    const mockData = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `item${i}`,
    }));
    const queryFn = jest.fn().mockResolvedValue(mockData);

    const result = await paginate({ limit: 10 }, queryFn);

    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe(10);
  });
});
