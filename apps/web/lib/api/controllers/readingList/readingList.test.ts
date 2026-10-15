import "dotenv/config";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("@linkwarden/filesystem", () => ({
  createFolder: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

vi.mock("next-i18next.config", () => ({
  i18n: { locales: ["en"] },
}));

let prisma: typeof import("@linkwarden/prisma").prisma;
let verifyUser: typeof import("@/lib/api/verifyUser").default;
let updateReadingList: typeof import("./updateReadingList").default;
let removeFromReadingList: typeof import("./removeFromReadingList").default;
let getReadingListState: typeof import("./getReadingListState").default;
let searchLinks: typeof import("../search/searchLinks").default;
let postLink: typeof import("../links/postLink").default;
let updateUserById: typeof import("../users/userId/updateUserById").default;
let readingListRoute: typeof import("@/pages/api/v1/reading-list").default;
let searchRoute: typeof import("@/pages/api/v1/search").default;

const createdUserIds: number[] = [];

const createUser = async () => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      username: `reading_list_${suffix}`,
      email: `reading_list_${suffix}@example.com`,
    },
  });

  createdUserIds.push(user.id);
  return user;
};

const createCollection = (ownerId: number, memberIds: number[] = []) =>
  prisma.collection.create({
    data: {
      name: "Reading list test",
      ownerId,
      members: {
        create: memberIds.map((userId) => ({
          userId,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        })),
      },
    },
  });

const createLinks = async (
  collectionId: number,
  createdById: number,
  count: number
) => {
  const links = [];
  for (let i = 0; i < count; i++) {
    links.push(
      await prisma.link.create({
        data: {
          name: `Link ${i}`,
          collectionId,
          createdById,
          collectionOrder: i,
        },
      })
    );
  }
  return links;
};

const rowsFor = (userId: number) =>
  prisma.readingListItem.findMany({
    where: { userId },
    orderBy: { linkId: "asc" },
  });

const setNow = (iso: string) => vi.setSystemTime(new Date(iso));

const listedIds = (result: any) =>
  result.data.links.map((link: { id: number }) => link.id);

const createMockResponse = () => {
  const state = {
    statusCode: 200,
    jsonBody: undefined as any,
    headers: new Map<string, string>(),
  };

  const res = {
    setHeader(name: string, value: string) {
      state.headers.set(name, value);
      return res;
    },
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: any) {
      state.jsonBody = body;
      return res;
    },
  };

  return { res: res as any, state };
};

describe
  .skipIf(!process.env.DATABASE_URL)
  .sequential("reading list (integration)", () => {
    beforeAll(async () => {
      vi.stubEnv("STRIPE_SECRET_KEY", "");

      prisma = (await import("@linkwarden/prisma")).prisma;
      verifyUser = (await import("@/lib/api/verifyUser")).default;
      updateReadingList = (await import("./updateReadingList")).default;
      removeFromReadingList = (await import("./removeFromReadingList")).default;
      getReadingListState = (await import("./getReadingListState")).default;
      searchLinks = (await import("../search/searchLinks")).default;
      postLink = (await import("../links/postLink")).default;
      updateUserById = (await import("../users/userId/updateUserById")).default;
      readingListRoute = (await import("@/pages/api/v1/reading-list")).default;
      searchRoute = (await import("@/pages/api/v1/search")).default;

      await prisma.$connect();
    });

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      setNow("2026-01-01T00:00:00.000Z");
    });

    afterEach(async () => {
      vi.useRealTimers();
      vi.unstubAllEnvs();
      vi.clearAllMocks();

      for (const id of createdUserIds.splice(0)) {
        await prisma.user.delete({ where: { id } }).catch(() => {});
      }
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    describe("updateReadingList", () => {
      it("adds links as unread", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [a, b] = await createLinks(id, user.id, 2);

        const result = await updateReadingList(user.id, {
          linkIds: [a.id, b.id],
          read: false,
        });

        expect(result.status).toBe(200);
        expect(await rowsFor(user.id)).toMatchObject([
          {
            linkId: a.id,
            readAt: null,
            addedAt: new Date("2026-01-01T00:00:00.000Z"),
          },
          {
            linkId: b.id,
            readAt: null,
            addedAt: new Date("2026-01-01T00:00:00.000Z"),
          },
        ]);
      });

      it("marks links as read", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [a] = await createLinks(id, user.id, 1);
        await updateReadingList(user.id, { linkIds: [a.id], read: false });

        setNow("2026-01-02T00:00:00.000Z");
        const result = await updateReadingList(user.id, {
          linkIds: [a.id],
          read: true,
        });

        expect(result.status).toBe(200);
        expect(await rowsFor(user.id)).toMatchObject([
          { linkId: a.id, readAt: new Date("2026-01-02T00:00:00.000Z") },
        ]);
      });

      it("moves a link marked unread back to the top of the queue", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [a] = await createLinks(id, user.id, 1);
        await updateReadingList(user.id, { linkIds: [a.id], read: false });
        setNow("2026-01-02T00:00:00.000Z");
        await updateReadingList(user.id, { linkIds: [a.id], read: true });

        setNow("2026-01-03T00:00:00.000Z");
        await updateReadingList(user.id, { linkIds: [a.id], read: false });

        expect(await rowsFor(user.id)).toMatchObject([
          {
            linkId: a.id,
            readAt: null,
            addedAt: new Date("2026-01-03T00:00:00.000Z"),
          },
        ]);
      });

      it("keeps the queue position of links that are already unread", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [a, b] = await createLinks(id, user.id, 2);
        await updateReadingList(user.id, { linkIds: [a.id], read: false });

        setNow("2026-01-02T00:00:00.000Z");
        await updateReadingList(user.id, {
          linkIds: [a.id, b.id],
          read: false,
        });

        expect(await rowsFor(user.id)).toMatchObject([
          { linkId: a.id, addedAt: new Date("2026-01-01T00:00:00.000Z") },
          { linkId: b.id, addedAt: new Date("2026-01-02T00:00:00.000Z") },
        ]);
      });

      it("accepts links from collections shared with the user", async () => {
        const owner = await createUser();
        const member = await createUser();
        const { id } = await createCollection(owner.id, [member.id]);
        const [link] = await createLinks(id, owner.id, 1);

        const result = await updateReadingList(member.id, {
          linkIds: [link.id],
          read: false,
        });

        expect(result.status).toBe(200);
        expect(await rowsFor(member.id)).toHaveLength(1);
      });

      it("rejects links the user cannot access without writing anything", async () => {
        const owner = await createUser();
        const other = await createUser();
        const { id: otherCollection } = await createCollection(other.id);
        const [own] = await createLinks(otherCollection, other.id, 1);
        const { id: privateCollection } = await createCollection(owner.id);
        const [secret] = await createLinks(privateCollection, owner.id, 1);

        const result = await updateReadingList(other.id, {
          linkIds: [own.id, secret.id],
          read: false,
        });

        expect(result.status).toBe(401);
        expect(await rowsFor(other.id)).toEqual([]);
      });

      it("rejects an empty list of links", async () => {
        const user = await createUser();

        const result = await updateReadingList(user.id, {
          linkIds: [],
          read: false,
        });

        expect(result.status).toBe(400);
      });
    });

    describe("removeFromReadingList", () => {
      it("removes only the requesting user's entries", async () => {
        const owner = await createUser();
        const member = await createUser();
        const { id } = await createCollection(owner.id, [member.id]);
        const [link] = await createLinks(id, owner.id, 1);
        await updateReadingList(owner.id, { linkIds: [link.id], read: false });
        await updateReadingList(member.id, {
          linkIds: [link.id],
          read: false,
        });

        const result = await removeFromReadingList(member.id, {
          linkIds: [link.id],
        });

        expect(result.status).toBe(200);
        expect(await rowsFor(member.id)).toEqual([]);
        expect(await rowsFor(owner.id)).toHaveLength(1);
      });

      it("rejects an empty list of links", async () => {
        const user = await createUser();

        const result = await removeFromReadingList(user.id, { linkIds: [] });

        expect(result.status).toBe(400);
      });
    });

    describe("getReadingListState", () => {
      it("returns unread and read link ids", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [a, b] = await createLinks(id, user.id, 2);
        await updateReadingList(user.id, {
          linkIds: [a.id, b.id],
          read: false,
        });
        await updateReadingList(user.id, { linkIds: [b.id], read: true });

        const result = await getReadingListState(user.id);

        expect(result).toEqual({
          status: 200,
          response: { unread: [a.id], read: [b.id] },
        });
      });

      it("leaves out links from collections the user lost access to", async () => {
        const owner = await createUser();
        const member = await createUser();
        const { id } = await createCollection(owner.id, [member.id]);
        const [link] = await createLinks(id, owner.id, 1);
        await updateReadingList(member.id, {
          linkIds: [link.id],
          read: false,
        });

        await prisma.usersAndCollections.delete({
          where: {
            userId_collectionId: { userId: member.id, collectionId: id },
          },
        });

        expect((await getReadingListState(member.id)).response).toEqual({
          unread: [],
          read: [],
        });
      });
    });

    describe("listing through searchLinks", () => {
      it("orders unread links by when they were added, newest first", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [a, b, notListed] = await createLinks(id, user.id, 3);
        await updateReadingList(user.id, { linkIds: [b.id], read: false });
        setNow("2026-01-02T00:00:00.000Z");
        await updateReadingList(user.id, { linkIds: [a.id], read: false });

        const result = await searchLinks({
          userId: user.id,
          query: { readingList: "unread" },
        });

        expect(listedIds(result)).toEqual([a.id, b.id]);
        expect(listedIds(result)).not.toContain(notListed.id);
      });

      it("orders read links by when they were read, newest first", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [a, b, c] = await createLinks(id, user.id, 3);
        await updateReadingList(user.id, {
          linkIds: [a.id, b.id, c.id],
          read: false,
        });
        setNow("2026-01-02T00:00:00.000Z");
        await updateReadingList(user.id, { linkIds: [b.id], read: true });
        setNow("2026-01-03T00:00:00.000Z");
        await updateReadingList(user.id, { linkIds: [a.id], read: true });

        const result = await searchLinks({
          userId: user.id,
          query: { readingList: "read" },
        });

        expect(listedIds(result)).toEqual([a.id, b.id]);
      });

      it("pages through the list using the link id as the cursor", async () => {
        vi.stubEnv("PAGINATION_TAKE_COUNT", "2");
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [a, b, c] = await createLinks(id, user.id, 3);
        for (const [link, day] of [
          [a, "01"],
          [b, "02"],
          [c, "03"],
        ] as const) {
          setNow(`2026-01-${day}T00:00:00.000Z`);
          await updateReadingList(user.id, { linkIds: [link.id], read: false });
        }

        const first = (await searchLinks({
          userId: user.id,
          query: { readingList: "unread" },
        })) as any;
        const second = (await searchLinks({
          userId: user.id,
          query: { readingList: "unread", cursor: first.data.nextCursor },
        })) as any;

        expect(listedIds(first)).toEqual([c.id, b.id]);
        expect(first.data.nextCursor).toBe(b.id);
        expect(listedIds(second)).toEqual([a.id]);
        expect(second.data.nextCursor).toBeNull();
      });
    });

    describe("capture rule in postLink", () => {
      it("adds links saved to a rule collection to the creator's list", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        await prisma.user.update({
          where: { id: user.id },
          data: { readingListCollections: [id] },
        });

        const result = await postLink(
          { name: "Saved", collection: { id } },
          user.id
        );

        expect(result.status).toBe(200);
        expect(await rowsFor(user.id)).toMatchObject([
          { linkId: (result.response as any).id, readAt: null },
        ]);
      });

      it("adds links whose tags match the rule", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        await prisma.user.update({
          where: { id: user.id },
          data: { readingListTags: ["to read"] },
        });

        await postLink(
          { name: "Tagged", collection: { id }, tags: [{ name: "To Read" }] },
          user.id
        );

        expect(await rowsFor(user.id)).toHaveLength(1);
      });

      it("leaves links that match no rule out of the list", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);

        await postLink({ name: "Plain", collection: { id } }, user.id);

        expect(await rowsFor(user.id)).toEqual([]);
      });

      it("lets the request opt out of a matching rule", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        await prisma.user.update({
          where: { id: user.id },
          data: { readingListCollections: [id] },
        });

        await postLink(
          { name: "Skip", collection: { id }, readingList: false },
          user.id
        );

        expect(await rowsFor(user.id)).toEqual([]);
      });

      it("lets the request opt in without a rule", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);

        await postLink(
          { name: "Queue", collection: { id }, readingList: true },
          user.id
        );

        expect(await rowsFor(user.id)).toHaveLength(1);
      });

      it("saves the rule through the account settings update", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);

        const result = await updateUserById(user.id, {
          username: user.username,
          readingListCollections: [id],
          readingListTags: ["Later"],
        } as any);

        expect(result.status).toBe(200);
        expect(
          await prisma.user.findUnique({
            where: { id: user.id },
            select: { readingListCollections: true, readingListTags: true },
          })
        ).toEqual({ readingListCollections: [id], readingListTags: ["Later"] });
      });
    });

    describe("/api/v1/reading-list", () => {
      it("returns the signed-in user's list state", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [link] = await createLinks(id, user.id, 1);
        await updateReadingList(user.id, { linkIds: [link.id], read: false });
        vi.mocked(verifyUser).mockResolvedValue(user);
        const { res, state } = createMockResponse();

        await readingListRoute(
          { method: "GET", query: {}, headers: {} } as any,
          res
        );

        expect(state.statusCode).toBe(200);
        expect(state.jsonBody).toEqual({
          response: { unread: [link.id], read: [] },
        });
      });

      it("adds with PUT and removes with DELETE", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [link] = await createLinks(id, user.id, 1);
        vi.mocked(verifyUser).mockResolvedValue(user);

        const put = createMockResponse();
        await readingListRoute(
          {
            method: "PUT",
            body: { linkIds: [link.id], read: false },
            headers: {},
          } as any,
          put.res
        );
        const rowsAfterPut = await rowsFor(user.id);

        const del = createMockResponse();
        await readingListRoute(
          {
            method: "DELETE",
            body: { linkIds: [link.id] },
            headers: {},
          } as any,
          del.res
        );

        expect(put.state.statusCode).toBe(200);
        expect(rowsAfterPut).toHaveLength(1);
        expect(del.state.statusCode).toBe(200);
        expect(await rowsFor(user.id)).toEqual([]);
      });

      it("blocks writes in the read-only demo", async () => {
        vi.stubEnv("NEXT_PUBLIC_DEMO", "true");
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [link] = await createLinks(id, user.id, 1);
        vi.mocked(verifyUser).mockResolvedValue(user);
        const { res, state } = createMockResponse();

        await readingListRoute(
          {
            method: "PUT",
            body: { linkIds: [link.id], read: false },
            headers: {},
          } as any,
          res
        );

        expect(state.statusCode).toBe(400);
        expect(await rowsFor(user.id)).toEqual([]);
      });

      it("rejects unsupported methods", async () => {
        const user = await createUser();
        vi.mocked(verifyUser).mockResolvedValue(user);
        const { res, state } = createMockResponse();

        await readingListRoute(
          { method: "PATCH", body: {}, headers: {} } as any,
          res
        );

        expect(state.statusCode).toBe(405);
        expect(state.headers.get("Allow")).toBe("GET, PUT, DELETE");
      });
    });

    describe("/api/v1/search", () => {
      it("returns the reading list when readingList=unread", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [, listed] = await createLinks(id, user.id, 2);
        await updateReadingList(user.id, {
          linkIds: [listed.id],
          read: false,
        });
        vi.mocked(verifyUser).mockResolvedValue(user);
        const { res, state } = createMockResponse();

        await searchRoute(
          {
            method: "GET",
            query: { readingList: "unread", cursor: "0", sort: "0" },
            headers: {},
          } as any,
          res
        );

        expect(state.statusCode).toBe(200);
        expect(listedIds(state.jsonBody)).toEqual([listed.id]);
      });

      it("ignores unknown readingList values", async () => {
        const user = await createUser();
        const { id } = await createCollection(user.id);
        const [a, b] = await createLinks(id, user.id, 2);
        vi.mocked(verifyUser).mockResolvedValue(user);
        const { res, state } = createMockResponse();

        await searchRoute(
          {
            method: "GET",
            query: { readingList: "everything", cursor: "0", sort: "0" },
            headers: {},
          } as any,
          res
        );

        expect(listedIds(state.jsonBody)).toEqual([b.id, a.id]);
      });
    });
  });
