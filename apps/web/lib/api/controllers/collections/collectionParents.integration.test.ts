import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// Runs against a real database (DATABASE_URL), since what matters here is how
// many queries a walk over parent links runs. Storage and search are mocked.

const { deleteDocuments } = vi.hoisted(() => ({ deleteDocuments: vi.fn() }));

vi.mock("@linkwarden/filesystem", () => ({
  createFolder: vi.fn(),
  removeFolder: vi.fn(),
}));

vi.mock("@linkwarden/lib/meilisearchClient", () => ({
  meiliClient: { index: () => ({ deleteDocuments }) },
}));

let prisma: typeof import("@linkwarden/prisma").prisma;
let postCollection: typeof import("./postCollection").default;
let updateCollection: typeof import("./collectionId/updateCollectionById").default;
let deleteCollection: typeof import("./collectionId/deleteCollectionById").default;

const createdUserIds: number[] = [];

// A walk that loops on a parent cycle never settles, so fail fast instead of
// waiting for the test timeout
const settles = <T>(promise: Promise<T>, ms = 5000) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Still running after ${ms}ms`)), ms)
    ),
  ]);

const createUser = async (label: string) => {
  const unique = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  const user = await prisma.user.create({
    data: {
      username: `${label}-${unique}`,
      email: `${label}-${unique}@lab.test`,
    },
  });
  createdUserIds.push(user.id);
  return user;
};

const create = async (userId: number, parentId?: number) => {
  const created = await settles(
    postCollection({ name: "collection", parentId }, userId)
  );
  expect(created.status).toBe(200);
  return created.response as { id: number; ownerId: number };
};

const move = (userId: number, id: number, parentId: number | "root") =>
  settles(
    updateCollection(userId, id, {
      id,
      name: "collection",
      parentId,
      members: [],
    })
  );

const parentOf = async (id: number) =>
  (
    await prisma.collection.findUnique({
      where: { id },
      select: { parentId: true },
    })
  )?.parentId;

// Writes parent links straight to the database, like a cycle saved before
// the API rejected them
const setParent = (id: number, parentId: number) =>
  prisma.collection.update({ where: { id }, data: { parentId } });

const addLink = (collectionId: number, createdById: number) =>
  prisma.link.create({
    data: {
      name: "link",
      url: "http://localhost/collection-parents",
      collectionId,
      createdById,
      collectionOrder: 0,
    },
  });

const admin = { canCreate: true, canUpdate: true, canDelete: true };

describe.skipIf(!process.env.DATABASE_URL)(
  "collection parents with a real database",
  () => {
    beforeAll(async () => {
      prisma = (await import("@linkwarden/prisma")).prisma;
      postCollection = (await import("./postCollection")).default;
      updateCollection = (await import("./collectionId/updateCollectionById"))
        .default;
      deleteCollection = (await import("./collectionId/deleteCollectionById"))
        .default;
    });

    // A failure queued with mockRejectedValueOnce that a test never reached
    // would otherwise fail the next delete
    afterEach(() => {
      deleteDocuments.mockReset();
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      await prisma.$disconnect();
    });

    describe("moving a collection", () => {
      it("moves a collection under another one and back to the root", async () => {
        const owner = await createUser("move");
        const a = await create(owner.id);
        const b = await create(owner.id);

        expect((await move(owner.id, a.id, b.id)).status).toBe(200);
        expect(await parentOf(a.id)).toBe(b.id);

        expect((await move(owner.id, a.id, "root")).status).toBe(200);
        expect(await parentOf(a.id)).toBeNull();
      });

      it("refuses to make a collection its own parent", async () => {
        const owner = await createUser("self");
        const a = await create(owner.id);

        expect((await move(owner.id, a.id, a.id)).status).toBe(400);
        expect(await parentOf(a.id)).toBeNull();
      });

      it("refuses a move that would close a cycle of two collections", async () => {
        const owner = await createUser("pair");
        const a = await create(owner.id);
        const b = await create(owner.id);

        expect((await move(owner.id, a.id, b.id)).status).toBe(200);
        expect((await move(owner.id, b.id, a.id)).status).toBe(400);
        expect(await parentOf(b.id)).toBeNull();
      });

      it("refuses to move a collection under a deeper sub-collection of its own", async () => {
        const owner = await createUser("deep");
        const a = await create(owner.id);
        const b = await create(owner.id, a.id);
        const c = await create(owner.id, b.id);

        expect((await move(owner.id, a.id, c.id)).status).toBe(400);
        expect(await parentOf(a.id)).toBeNull();

        // Moving a sub-collection to another branch of the same tree still works
        const d = await create(owner.id, a.id);
        expect((await move(owner.id, c.id, d.id)).status).toBe(200);
        expect(await parentOf(c.id)).toBe(d.id);
      });

      it("refuses to move a collection under someone else's collection", async () => {
        const owner = await createUser("mine");
        const other = await createUser("theirs");
        const a = await create(owner.id);
        const theirs = await create(other.id);

        expect((await move(owner.id, a.id, theirs.id)).status).toBe(403);
        expect(await parentOf(a.id)).toBeNull();
      });

      it("won't let a member move a collection they don't own", async () => {
        const owner = await createUser("owner");
        const member = await createUser("member");
        const a = await create(owner.id);
        const b = await create(owner.id);
        await prisma.usersAndCollections.create({
          data: { userId: member.id, collectionId: a.id, ...admin },
        });

        expect((await move(member.id, a.id, b.id)).status).toBe(401);
        expect(await parentOf(a.id)).toBeNull();
      });

      it("won't let a member move the owner's collection under one of their own", async () => {
        const owner = await createUser("owner-target");
        const member = await createUser("member-target");
        const a = await create(owner.id);
        const theirs = await create(member.id);
        await prisma.usersAndCollections.create({
          data: { userId: member.id, collectionId: a.id, ...admin },
        });

        expect((await move(member.id, a.id, theirs.id)).status).toBe(401);
        expect(await parentOf(a.id)).toBeNull();
      });

      it("won't let someone without access move a collection", async () => {
        const owner = await createUser("owner-stranger");
        const stranger = await createUser("stranger");
        const a = await create(owner.id);
        const b = await create(owner.id);

        expect((await move(stranger.id, a.id, b.id)).status).toBe(401);
        expect(await parentOf(a.id)).toBeNull();
      });

      it("refuses to move a collection under one its owner is only a member of", async () => {
        const owner = await createUser("owner-shared");
        const other = await createUser("other-shared");
        const a = await create(owner.id);
        const shared = await create(other.id);
        await prisma.usersAndCollections.create({
          data: { userId: owner.id, collectionId: shared.id, ...admin },
        });

        expect((await move(owner.id, a.id, shared.id)).status).toBe(403);
        expect(await parentOf(a.id)).toBeNull();
      });

      it("checks a move under the bottom of a 100-level tree", async () => {
        const owner = await createUser("deep-tree");
        const top = await create(owner.id);
        const other = await create(owner.id);

        // Written straight to the database, since creating each level through
        // the API walks every level above it
        let bottom = top;
        for (let level = 1; level < 100; level++) {
          bottom = await prisma.collection.create({
            data: {
              name: "collection",
              ownerId: owner.id,
              parentId: bottom.id,
            },
          });
        }

        expect((await move(owner.id, top.id, bottom.id)).status).toBe(400);
        expect(await parentOf(top.id)).toBeNull();

        expect((await move(owner.id, other.id, bottom.id)).status).toBe(200);
        expect(await parentOf(other.id)).toBe(bottom.id);
      });

      it("still moves a collection under a parent whose ancestors already form a cycle", async () => {
        const owner = await createUser("cyclic-ancestors");
        const x = await create(owner.id);
        const y = await create(owner.id);
        const a = await create(owner.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);

        expect((await move(owner.id, a.id, x.id)).status).toBe(200);
        expect(await parentOf(a.id)).toBe(x.id);
      });

      it("refuses to move a collection under one that doesn't exist", async () => {
        const owner = await createUser("missing");
        const a = await create(owner.id);

        expect((await move(owner.id, a.id, 2147483647)).status).toBe(403);
        expect(await parentOf(a.id)).toBeNull();
      });

      it("keeps a sub-collection in place when an edit sends the parent it already has", async () => {
        const owner = await createUser("same-parent");
        const a = await create(owner.id);
        const b = await create(owner.id, a.id);

        // The edit modals send the whole collection, parentId included
        const renamed = await settles(
          updateCollection(owner.id, b.id, {
            id: b.id,
            name: "renamed",
            parentId: a.id,
            members: [],
          })
        );

        expect(renamed.status).toBe(200);
        expect(await parentOf(b.id)).toBe(a.id);
      });

      // Known gap: each move checks the tree before the other one is saved, so
      // both pass and the cycle is saved. Turn this on once moves are serialized.
      it.skip("doesn't save a cycle when two opposite moves arrive together", async () => {
        const owner = await createUser("race");
        const a = await create(owner.id);
        const b = await create(owner.id);

        const moved = await Promise.all([
          move(owner.id, a.id, b.id),
          move(owner.id, b.id, a.id),
        ]);

        expect(moved.map((m) => m.status).sort()).toEqual([200, 400]);
        expect([await parentOf(a.id), await parentOf(b.id)]).toContain(null);
      });

      // Prisma drops the fraction from an id, but the cycle check compares ids
      // exactly, so a fractional id would get a move past it
      it("refuses to make a collection its own parent with a fractional parentId", async () => {
        const owner = await createUser("fraction-parent");
        const a = await create(owner.id);

        expect((await move(owner.id, a.id, a.id + 0.5)).status).toBe(400);
        expect(await parentOf(a.id)).toBeNull();
      });

      it("refuses to move a collection under its own sub-collection when its id is fractional", async () => {
        const owner = await createUser("fraction-id");
        const a = await create(owner.id);
        const b = await create(owner.id, a.id);

        // The route hands on the id from the URL as a number, fraction included
        const moved = await settles(
          updateCollection(owner.id, a.id + 0.5, {
            id: a.id,
            name: "collection",
            parentId: b.id,
            members: [],
          })
        );

        expect(moved.status).toBe(401);
        expect(await parentOf(a.id)).toBeNull();
      });
    });

    describe("collections already saved in a parent cycle", () => {
      it("gives a member's sub-collection inside the cycle to the cycle's owner", async () => {
        const owner = await createUser("cycle-post");
        const member = await createUser("cycle-post-member");
        const x = await create(owner.id);
        const y = await create(owner.id);
        await prisma.usersAndCollections.create({
          data: { userId: member.id, collectionId: x.id, ...admin },
        });
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);

        const child = await create(member.id, x.id);

        expect(child.ownerId).toBe(owner.id);
        expect(await parentOf(child.id)).toBe(x.id);
      });

      it("creates a sub-collection under a collection that is its own parent", async () => {
        const owner = await createUser("self-post");
        const x = await create(owner.id);
        await setParent(x.id, x.id);

        const child = await create(owner.id, x.id);
        expect(await parentOf(child.id)).toBe(x.id);
      });

      it("propagates members to the rest of the cycle", async () => {
        const owner = await createUser("cycle-propagate");
        const member = await createUser("cycle-propagate-member");
        const x = await create(owner.id);
        const y = await create(owner.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);

        const updated = await settles(
          updateCollection(owner.id, x.id, {
            id: x.id,
            name: "collection",
            members: [{ userId: member.id, ...admin }],
            propagateToSubcollections: true,
          })
        );

        expect(updated.status).toBe(200);
        expect(
          await prisma.usersAndCollections.count({
            where: { userId: member.id, collectionId: { in: [x.id, y.id] } },
          })
        ).toBe(2);
      });

      it("deletes every collection in the cycle along with their links", async () => {
        const owner = await createUser("cycle-delete");
        const x = await create(owner.id);
        const y = await create(owner.id);
        const linkX = await addLink(x.id, owner.id);
        const linkY = await addLink(y.id, owner.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);
        deleteDocuments.mockClear();

        const deleted = await settles(deleteCollection(owner.id, x.id));

        expect(deleted.status).toBe(200);
        expect(
          await prisma.collection.count({ where: { id: { in: [x.id, y.id] } } })
        ).toBe(0);
        // Both sets of links leave the search index, not only the database
        expect(deleteDocuments.mock.calls.flat(2).sort()).toEqual(
          [linkX.id, linkY.id].sort()
        );
      });

      it("deletes a collection that is its own parent", async () => {
        const owner = await createUser("self-delete");
        const x = await create(owner.id);
        await addLink(x.id, owner.id);
        await setParent(x.id, x.id);

        const deleted = await settles(deleteCollection(owner.id, x.id));

        expect(deleted.status).toBe(200);
        expect(await prisma.collection.count({ where: { id: x.id } })).toBe(0);
      });

      it("deletes a cycle of three with a branch, and every link in it", async () => {
        const owner = await createUser("cycle-three");
        const x = await create(owner.id);
        const y = await create(owner.id, x.id);
        const z = await create(owner.id, y.id);
        const branch = await create(owner.id, y.id);
        const links = await Promise.all(
          [x, y, z, branch].map((c) => addLink(c.id, owner.id))
        );
        await setParent(x.id, z.id);
        deleteDocuments.mockClear();

        const deleted = await settles(deleteCollection(owner.id, y.id));

        expect(deleted.status).toBe(200);
        expect(
          await prisma.collection.count({
            where: { id: { in: [x.id, y.id, z.id, branch.id] } },
          })
        ).toBe(0);
        expect(deleteDocuments.mock.calls.flat(2).sort()).toEqual(
          links.map((link) => link.id).sort()
        );
      });

      it("deletes a collection below a cycle and leaves the cycle alone", async () => {
        const owner = await createUser("below-cycle");
        const x = await create(owner.id);
        const y = await create(owner.id);
        const below = await create(owner.id, x.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);

        expect(
          (await settles(deleteCollection(owner.id, below.id))).status
        ).toBe(200);
        expect(await prisma.collection.count({ where: { id: below.id } })).toBe(
          0
        );
        expect(await parentOf(x.id)).toBe(y.id);
        expect(await parentOf(y.id)).toBe(x.id);
      });

      it("moves a collection out of a cycle to the top level", async () => {
        const owner = await createUser("cycle-root");
        const x = await create(owner.id);
        const y = await create(owner.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);

        expect((await move(owner.id, x.id, "root")).status).toBe(200);
        expect(await parentOf(x.id)).toBeNull();
        expect(await parentOf(y.id)).toBe(x.id);
      });

      it("moves a collection out of a cycle under one outside it", async () => {
        const owner = await createUser("cycle-out");
        const x = await create(owner.id);
        const y = await create(owner.id);
        const outside = await create(owner.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);

        expect((await move(owner.id, x.id, outside.id)).status).toBe(200);
        expect(await parentOf(x.id)).toBe(outside.id);
        expect(await parentOf(y.id)).toBe(x.id);
      });

      it("lets the owner edit a collection in a cycle without moving it", async () => {
        const owner = await createUser("cycle-edit");
        const x = await create(owner.id);
        const y = await create(owner.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);

        // The edit modals send the parent the collection already has
        const renamed = await settles(
          updateCollection(owner.id, x.id, {
            id: x.id,
            name: "renamed",
            parentId: y.id,
            members: [],
          })
        );

        expect(renamed.status).toBe(200);
        expect(await parentOf(x.id)).toBe(y.id);
        expect(
          (await prisma.collection.findUnique({ where: { id: x.id } }))?.name
        ).toBe("renamed");
      });

      it("still refuses to move a collection in a cycle under another one in that cycle", async () => {
        const owner = await createUser("cycle-inside");
        const x = await create(owner.id);
        const y = await create(owner.id, x.id);
        const z = await create(owner.id, y.id);
        await setParent(x.id, z.id);

        // y is under x, so this would only make a smaller cycle
        expect((await move(owner.id, x.id, y.id)).status).toBe(400);
        expect(await parentOf(x.id)).toBe(z.id);
      });

      it("refuses to move a collection in a cycle under one hanging below that cycle", async () => {
        const owner = await createUser("cycle-below-move");
        const x = await create(owner.id);
        const y = await create(owner.id);
        const below = await create(owner.id, x.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);

        expect((await move(owner.id, x.id, below.id)).status).toBe(400);
        expect(await parentOf(x.id)).toBe(y.id);
      });

      it("shares a collection in a cycle with everything in that cycle", async () => {
        const owner = await createUser("cycle-share");
        const member = await createUser("cycle-share-member");
        const x = await create(owner.id);
        const y = await create(owner.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);

        // The sharing modal sends the parent the collection already has
        const shared = await settles(
          updateCollection(owner.id, x.id, {
            id: x.id,
            name: "collection",
            parentId: y.id,
            members: [{ userId: member.id, ...admin }],
            propagateToSubcollections: true,
          })
        );

        expect(shared.status).toBe(200);
        expect(await parentOf(x.id)).toBe(y.id);
        expect(
          await prisma.usersAndCollections.count({
            where: { userId: member.id, collectionId: { in: [x.id, y.id] } },
          })
        ).toBe(2);
      });

      it("lets the owner edit a collection that is its own parent, then move it to the top level", async () => {
        const owner = await createUser("self-edit");
        const x = await create(owner.id);
        await setParent(x.id, x.id);

        const renamed = await settles(
          updateCollection(owner.id, x.id, {
            id: x.id,
            name: "renamed",
            parentId: x.id,
            members: [],
          })
        );
        expect(renamed.status).toBe(200);
        expect(await parentOf(x.id)).toBe(x.id);

        expect((await move(owner.id, x.id, "root")).status).toBe(200);
        expect(await parentOf(x.id)).toBeNull();
      });

      it("refuses to move a collection that is its own parent under its sub-collection", async () => {
        const owner = await createUser("self-move");
        const x = await create(owner.id);
        await setParent(x.id, x.id);
        const child = await create(owner.id, x.id);

        expect((await move(owner.id, x.id, child.id)).status).toBe(400);
        expect(await parentOf(x.id)).toBe(x.id);
      });

      it("takes a collection out of its cycle and keeps everything when deleting it fails partway", async () => {
        const owner = await createUser("cycle-delete-fails");
        const x = await create(owner.id);
        const y = await create(owner.id);
        await addLink(x.id, owner.id);
        await addLink(y.id, owner.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);
        deleteDocuments.mockRejectedValueOnce(new Error("Search is down"));

        await expect(settles(deleteCollection(owner.id, x.id))).rejects.toThrow(
          "Search is down"
        );

        // x was detached before the failure, so it's at the top level with y
        // still under it
        expect(await parentOf(x.id)).toBeNull();
        expect(await parentOf(y.id)).toBe(x.id);
        expect(
          await prisma.link.count({
            where: { collectionId: { in: [x.id, y.id] } },
          })
        ).toBe(2);
      });

      it("won't let someone without access delete a collection in a cycle", async () => {
        const owner = await createUser("cycle-stranger");
        const stranger = await createUser("cycle-stranger-other");
        const x = await create(owner.id);
        const y = await create(owner.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);

        expect(
          (await settles(deleteCollection(stranger.id, x.id))).status
        ).toBe(401);
        expect(await parentOf(x.id)).toBe(y.id);
        expect(await parentOf(y.id)).toBe(x.id);
      });

      it("won't delete a collection in a cycle through a fractional id", async () => {
        const owner = await createUser("cycle-fraction");
        const x = await create(owner.id);
        const y = await create(owner.id);
        await setParent(x.id, y.id);
        await setParent(y.id, x.id);

        expect(
          (await settles(deleteCollection(owner.id, x.id + 0.5))).status
        ).toBe(401);
        expect(await parentOf(x.id)).toBe(y.id);
        expect(await parentOf(y.id)).toBe(x.id);
      });
    });

    describe("collection trees without cycles", () => {
      it("gives a member's sub-collection to the owner at the top of the tree", async () => {
        const owner = await createUser("tree-owner");
        const member = await createUser("tree-member");
        const a = await create(owner.id);
        const b = await create(owner.id, a.id);
        const c = await create(owner.id, b.id);
        await prisma.usersAndCollections.create({
          data: { userId: member.id, collectionId: c.id, ...admin },
        });

        const child = await create(member.id, c.id);

        const members = await prisma.usersAndCollections.findMany({
          where: { collectionId: child.id },
        });
        expect(child.ownerId).toBe(owner.id);
        expect(members.map((m) => m.userId)).toEqual([member.id]);
      });

      it("refuses a fractional parentId for a new collection", async () => {
        const owner = await createUser("tree-fraction");
        const a = await create(owner.id);

        const created = await settles(
          postCollection({ name: "collection", parentId: a.id + 0.5 }, owner.id)
        );

        expect(created.status).toBe(400);
        expect(
          await prisma.collection.count({ where: { parentId: a.id } })
        ).toBe(0);
      });

      it("propagates members to every level below", async () => {
        const owner = await createUser("tree-propagate");
        const member = await createUser("tree-propagate-member");
        const a = await create(owner.id);
        const b = await create(owner.id, a.id);
        const c = await create(owner.id, b.id);
        const sibling = await create(owner.id, a.id);

        const updated = await settles(
          updateCollection(owner.id, a.id, {
            id: a.id,
            name: "collection",
            members: [{ userId: member.id, ...admin }],
            propagateToSubcollections: true,
          })
        );

        expect(updated.status).toBe(200);
        expect(
          await prisma.usersAndCollections.count({
            where: {
              userId: member.id,
              collectionId: { in: [a.id, b.id, c.id, sibling.id] },
            },
          })
        ).toBe(4);
      });

      it("deletes a collection with every level of sub-collections", async () => {
        const owner = await createUser("tree-delete");
        const a = await create(owner.id);
        const b = await create(owner.id, a.id);
        const c = await create(owner.id, b.id);
        const other = await create(owner.id);

        expect((await settles(deleteCollection(owner.id, a.id))).status).toBe(
          200
        );
        expect(
          await prisma.collection.count({
            where: { id: { in: [a.id, b.id, c.id] } },
          })
        ).toBe(0);
        expect(await prisma.collection.count({ where: { id: other.id } })).toBe(
          1
        );
      });

      it("deletes a sub-collection and leaves the collections above it alone", async () => {
        const owner = await createUser("tree-delete-middle");
        const a = await create(owner.id);
        const b = await create(owner.id, a.id);
        const c = await create(owner.id, b.id);
        const sibling = await create(owner.id, a.id);

        expect((await settles(deleteCollection(owner.id, b.id))).status).toBe(
          200
        );
        expect(
          await prisma.collection.count({ where: { id: { in: [b.id, c.id] } } })
        ).toBe(0);
        expect(await parentOf(a.id)).toBeNull();
        expect(await parentOf(sibling.id)).toBe(a.id);
      });

      it("leaves a sub-collection under its parent when deleting it fails partway", async () => {
        const owner = await createUser("tree-delete-fails");
        const a = await create(owner.id);
        const b = await create(owner.id, a.id);
        deleteDocuments.mockRejectedValueOnce(new Error("Search is down"));

        await expect(settles(deleteCollection(owner.id, b.id))).rejects.toThrow(
          "Search is down"
        );
        expect(await parentOf(b.id)).toBe(a.id);
      });

      it("won't let someone without access delete a collection", async () => {
        const owner = await createUser("tree-stranger");
        const stranger = await createUser("tree-stranger-other");
        const a = await create(owner.id);
        const b = await create(owner.id, a.id);

        expect(
          (await settles(deleteCollection(stranger.id, a.id))).status
        ).toBe(401);
        expect(
          await prisma.collection.count({ where: { id: { in: [a.id, b.id] } } })
        ).toBe(2);
      });

      it("lets a member leave a sub-collection without deleting it", async () => {
        const owner = await createUser("tree-leave");
        const member = await createUser("tree-leave-member");
        const a = await create(owner.id);
        const b = await create(owner.id, a.id);
        await prisma.usersAndCollections.create({
          data: { userId: member.id, collectionId: b.id, ...admin },
        });

        expect((await settles(deleteCollection(member.id, b.id))).status).toBe(
          200
        );
        expect(await parentOf(b.id)).toBe(a.id);
        expect(
          await prisma.usersAndCollections.count({
            where: { userId: member.id, collectionId: b.id },
          })
        ).toBe(0);
      });
    });
  }
);
