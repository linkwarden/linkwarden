import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sort } from "@linkwarden/types/global";
import { prisma } from "@linkwarden/prisma";
import getAccessibleCollectionIds from "@/lib/api/getAccessibleCollectionIds";
import getDashboardData from "./getDashboardData";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    link: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/getAccessibleCollectionIds", () => ({
  default: vi.fn(),
}));

type Row = {
  id: number;
  name: string;
  importDate: Date | null;
  createdAt: Date;
};

const importedOld: Row = {
  id: 100,
  name: "Zeta imported in 2025",
  importDate: new Date("2025-01-05T00:00:00.000Z"),
  createdAt: new Date("2026-07-09T14:00:00.000Z"),
};

const importedNew: Row = {
  id: 1,
  name: "Alpha imported in 2026",
  importDate: new Date("2026-09-20T00:00:00.000Z"),
  createdAt: new Date("2026-07-09T14:00:00.000Z"),
};

const manual: Row = {
  id: 50,
  name: "Mike added in app",
  importDate: null,
  createdAt: new Date("2026-10-30T09:00:00.000Z"),
};

const includesImportDateNotNull = (args: any) =>
  JSON.stringify(args.where).includes('"importDate":{"not":null}');

const includesImportDateNull = (args: any) =>
  JSON.stringify(args.where).includes('"importDate":null');

const isPinnedQuery = (args: any) =>
  JSON.stringify(args.where).includes('"pinnedBy":{"some"');

describe("getDashboardData ordering", () => {
  beforeEach(() => {
    vi.mocked(getAccessibleCollectionIds).mockResolvedValue({
      accessibleCollectionIds: [1],
      memberCollectionIds: [],
    } as any);

    vi.mocked(prisma.link.findMany).mockImplementation((async (args: any) => {
      // Pinned half returns nothing so the expectations below only describe the
      // recently-added half.
      if (isPinnedQuery(args)) return [];
      if (includesImportDateNotNull(args)) return [importedOld, importedNew];
      if (includesImportDateNull(args)) return [manual];
      return [importedOld, importedNew, manual];
    }) as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("orders by the date the UI shows, not by row id", async () => {
    const { response } = await getDashboardData(7, {
      sort: Sort.DateNewestFirst,
    });

    // id 100 is the oldest bookmark and id 1 is the newest. Ordering by id
    // (the reported bug) would put 100 first; ordering by the effective date
    // puts 50, 1, 100.
    expect(response.map((link: any) => link.id)).toEqual([50, 1, 100]);
  });

  it("queries imported and in-app links with their own date column", async () => {
    await getDashboardData(7, { sort: Sort.DateNewestFirst });

    expect(prisma.link.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ importDate: "desc" }, { id: "desc" }],
      })
    );

    expect(prisma.link.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      })
    );
  });

  it("reverses the order for DateOldestFirst", async () => {
    const { response } = await getDashboardData(7, {
      sort: Sort.DateOldestFirst,
    });

    expect(response.map((link: any) => link.id)).toEqual([100, 1, 50]);

    expect(prisma.link.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ importDate: "asc" }, { id: "asc" }],
      })
    );
  });

  it("sorts by name when a name sort is requested", async () => {
    const { response } = await getDashboardData(7, { sort: Sort.NameAZ });

    expect(response.map((link: any) => link.name)).toEqual([
      "Alpha imported in 2026",
      "Mike added in app",
      "Zeta imported in 2025",
    ]);

    expect(prisma.link.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ name: "asc" }, { id: "asc" }],
      })
    );
  });

  it("treats a missing sort as newest first", async () => {
    const { response } = await getDashboardData(7, {});

    expect(response.map((link: any) => link.id)).toEqual([50, 1, 100]);
  });
});
