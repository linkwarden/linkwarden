import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@linkwarden/prisma";
import updateLinkOrder from "./updateLinkOrder";
import {
  COLLECTION_ORDER_STEP,
  nextCollectionOrder,
  seedCollectionOrderForLinks,
} from "@linkwarden/lib/linkOrder";

let ownerId: number;
let adminMemberId: number;
let contributorId: number;
let outsiderId: number;
let collectionId: number;
let otherCollectionId: number;
let linkIds: number[] = [];

const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const makeUser = async (name: string) => {
  const user = await prisma.user.create({
    data: { username: `${name}_${suffix}`, email: `${name}_${suffix}@x.test` },
  });
  return user.id;
};

// The list is read highest order first, so this is top-to-bottom as a reader sees it.
const listOrder = async (id: number) => {
  const links = await prisma.link.findMany({
    where: { collectionId: id },
    orderBy: [{ collectionOrder: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  return links.map((l) => l.id);
};

const orderOf = async (linkId: number) => {
  const link = await prisma.link.findUniqueOrThrow({
    where: { id: linkId },
    select: { collectionOrder: true },
  });
  return link.collectionOrder;
};

beforeAll(async () => {
  ownerId = await makeUser("owner");
  adminMemberId = await makeUser("admin");
  contributorId = await makeUser("contrib");
  outsiderId = await makeUser("outsider");

  const collection = await prisma.collection.create({
    data: { name: `c_${suffix}`, ownerId },
  });
  collectionId = collection.id;

  const other = await prisma.collection.create({
    data: { name: `other_${suffix}`, ownerId },
  });
  otherCollectionId = other.id;

  await prisma.usersAndCollections.createMany({
    data: [
      {
        userId: adminMemberId,
        collectionId,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      },
      {
        userId: contributorId,
        collectionId,
        canCreate: true,
        canUpdate: false,
        canDelete: false,
      },
    ],
  });

  // Six links numbered the way the migration numbers them: oldest lowest.
  for (let i = 1; i <= 6; i++) {
    const link = await prisma.link.create({
      data: {
        name: `link ${i}`,
        url: `https://example.test/${suffix}/${i}`,
        collectionId,
        collectionOrder: i * COLLECTION_ORDER_STEP,
      },
    });
    linkIds.push(link.id);
  }

  await prisma.link.create({
    data: {
      name: "elsewhere",
      url: `https://example.test/${suffix}/elsewhere`,
      collectionId: otherCollectionId,
      collectionOrder: COLLECTION_ORDER_STEP,
    },
  });
});

afterAll(async () => {
  for (const id of [ownerId, adminMemberId, contributorId, outsiderId]) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe("updateLinkOrder", () => {
  it("seeds newest-first, matching the default list", async () => {
    const [l1, l2, l3, l4, l5, l6] = linkIds;
    expect(await listOrder(collectionId)).toEqual([l6, l5, l4, l3, l2, l1]);
  });

  it("puts a link at the top when no beforeId is given", async () => {
    const [l1, l2, l3, l4, l5, l6] = linkIds;

    const result = await updateLinkOrder(ownerId, l1, {});
    expect(result.status).toBe(200);

    expect(await listOrder(collectionId)).toEqual([l1, l6, l5, l4, l3, l2]);
  });

  it("puts a link directly below the link named by beforeId", async () => {
    const [l1, l2, l3, l4, l5, l6] = linkIds;

    const result = await updateLinkOrder(ownerId, l1, { beforeId: l4 });
    expect(result.status).toBe(200);

    expect(await listOrder(collectionId)).toEqual([l6, l5, l4, l1, l3, l2]);
  });

  it("takes the midpoint of the two neighbours", async () => {
    const [l1, l2, l3, l4, l5, l6] = linkIds;

    const above = await orderOf(l4);
    const below = await orderOf(l3);
    expect(await orderOf(l1)).toBe((above + below) / 2);
  });

  it("puts a link last when beforeId is the bottom link", async () => {
    const [l1, l2, l3, l4, l5, l6] = linkIds;

    const result = await updateLinkOrder(ownerId, l5, { beforeId: l2 });
    expect(result.status).toBe(200);

    expect(await listOrder(collectionId)).toEqual([l6, l4, l1, l3, l2, l5]);
  });

  it("lets a collection member with the admin role reorder", async () => {
    const [l1, l2, l3, l4, l5, l6] = linkIds;

    const result = await updateLinkOrder(adminMemberId, l6, { beforeId: l3 });
    expect(result.status).toBe(200);
    expect(await listOrder(collectionId)).toEqual([l4, l1, l3, l6, l2, l5]);
  });

  it("refuses a member who can only add links", async () => {
    const [l1] = linkIds;

    const result = await updateLinkOrder(contributorId, l1, {});
    expect(result.status).toBe(401);
  });

  it("refuses someone with no access to the collection", async () => {
    const [l1] = linkIds;

    const result = await updateLinkOrder(outsiderId, l1, {});
    expect(result.status).toBe(401);
  });

  it("refuses a beforeId from another collection", async () => {
    const [l1] = linkIds;
    const elsewhere = await prisma.link.findFirstOrThrow({
      where: { collectionId: otherCollectionId },
    });

    const result = await updateLinkOrder(ownerId, l1, {
      beforeId: elsewhere.id,
    });
    expect(result.status).toBe(400);
  });

  it("refuses ordering a link against itself", async () => {
    const [l1] = linkIds;

    const result = await updateLinkOrder(ownerId, l1, { beforeId: l1 });
    expect(result.status).toBe(400);
  });

  it("refuses a link that does not exist", async () => {
    const result = await updateLinkOrder(ownerId, 2147483600, {});
    expect(result.status).toBe(404);
  });

  // Raw SQL, because Prisma rounds a double to about 16 significant figures on the way
  // in and these tests need two orders a hair apart.
  const setOrderExactly = async (linkId: number, order: string) => {
    await prisma.$executeRawUnsafe(
      `UPDATE "Link" SET "collectionOrder" = ${order}::double precision WHERE "id" = ${linkId}`
    );
  };

  /**
   * A collection of four links where the middle two have been squeezed together, which
   * is the state a collection reaches after a link is dropped into the same gap a few
   * dozen times. Its own collection, so it doesn't inherit whatever the tests above
   * left behind.
   */
  const squeezedCollection = async (aboveOrder: string, belowOrder: string) => {
    const collection = await prisma.collection.create({
      data: { name: `squeezed_${suffix}_${aboveOrder}`, ownerId },
    });

    const made: number[] = [];
    for (let i = 1; i <= 4; i++) {
      const link = await prisma.link.create({
        data: {
          name: `squeezed ${i}`,
          collectionId: collection.id,
          collectionOrder: i * COLLECTION_ORDER_STEP,
        },
      });
      made.push(link.id);
    }

    const [bottom, below, above, moving] = made;

    await setOrderExactly(above, aboveOrder);
    await setOrderExactly(below, belowOrder);
    // Keeps the squeezed pair in the middle of the list rather than under the bottom
    // link, whatever order they were squeezed to.
    await setOrderExactly(bottom, "-1");

    return { collectionId: collection.id, bottom, below, above, moving };
  };

  const reseedsAndRetries = async (aboveOrder: string, belowOrder: string) => {
    const squeezed = await squeezedCollection(aboveOrder, belowOrder);

    const result = await updateLinkOrder(ownerId, squeezed.moving, {
      beforeId: squeezed.above,
    });
    expect(result.status).toBe(200);

    // The collection was spread back out onto the step, bar the link just dropped in.
    const links = await prisma.link.findMany({
      where: { collectionId: squeezed.collectionId },
      select: { collectionOrder: true },
    });
    const offStep = links.filter(
      (l) => l.collectionOrder % COLLECTION_ORDER_STEP !== 0
    );
    expect(offStep.length).toBe(1);

    // And the link ended up exactly where it was dropped, below the link it was
    // dropped under, with the order of everything else untouched.
    expect(await listOrder(squeezed.collectionId)).toEqual([
      squeezed.above,
      squeezed.moving,
      squeezed.below,
      squeezed.bottom,
    ]);
  };

  it("reseeds and retries when two neighbours are one double apart", async () => {
    await reseedsAndRetries("2.0000000000000004", "2");
  });

  it("reseeds and retries when two neighbours hold the same order", async () => {
    await reseedsAndRetries("100", "100");
  });

  it("keeps the arranged order across a reseed", async () => {
    const before = await listOrder(collectionId);

    await seedCollectionOrderForLinks(collectionId);

    expect(await listOrder(collectionId)).toEqual(before);

    const links = await prisma.link.findMany({
      where: { collectionId },
      select: { collectionOrder: true },
    });
    expect(
      links.every((l) => l.collectionOrder % COLLECTION_ORDER_STEP === 0)
    ).toBe(true);
  });

  it("hands a new link the top of the collection", async () => {
    const top = await nextCollectionOrder(collectionId);
    const highest = await prisma.link.aggregate({
      where: { collectionId },
      _max: { collectionOrder: true },
    });

    expect(top).toBe(
      (highest._max.collectionOrder ?? 0) + COLLECTION_ORDER_STEP
    );
  });

  it("starts an empty collection at one step", async () => {
    const empty = await prisma.collection.create({
      data: { name: `empty_${suffix}`, ownerId },
    });
    expect(await nextCollectionOrder(empty.id)).toBe(COLLECTION_ORDER_STEP);
  });
});
