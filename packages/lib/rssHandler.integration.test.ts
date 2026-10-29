import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@linkwarden/prisma";
import { rssHandler } from "./rssHandler";

let ownerId: number;
let writerId: number;
let viewerId: number;
let formerMemberId: number;
let collectionId: number;

const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const makeUser = async (name: string) => {
  const user = await prisma.user.create({
    data: { username: `${name}_${suffix}`, email: `${name}_${suffix}@x.test` },
  });
  return user.id;
};

const feedWithOneItem = (name: string) => {
  const pubDate = new Date().toUTCString();
  return {
    lastBuildDate: pubDate,
    items: [
      {
        title: name,
        link: `https://1.1.1.1/${suffix}/${name}`,
        pubDate,
      },
    ],
  } as any;
};

const subscribe = (subscriberId: number, name: string) =>
  prisma.rssSubscription.create({
    data: {
      name: `${name}_${suffix}`,
      url: `https://1.1.1.1/${suffix}/${name}.xml`,
      ownerId: subscriberId,
      collectionId,
    },
  });

const importedLink = (name: string) =>
  prisma.link.findFirst({
    where: { collectionId, url: `https://1.1.1.1/${suffix}/${name}` },
    select: { createdById: true },
  });

const subscriptionExists = async (id: number) =>
  (await prisma.rssSubscription.count({ where: { id } })) > 0;

beforeAll(async () => {
  ownerId = await makeUser("owner");
  writerId = await makeUser("writer");
  viewerId = await makeUser("viewer");
  formerMemberId = await makeUser("former");

  const collection = await prisma.collection.create({
    data: { name: `c_${suffix}`, ownerId },
  });
  collectionId = collection.id;

  await prisma.usersAndCollections.createMany({
    data: [
      {
        userId: writerId,
        collectionId,
        canCreate: true,
        canUpdate: false,
        canDelete: false,
      },
      {
        userId: viewerId,
        collectionId,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      },
      {
        userId: formerMemberId,
        collectionId,
        canCreate: true,
        canUpdate: false,
        canDelete: false,
      },
    ],
  });
});

afterAll(async () => {
  for (const id of [ownerId, writerId, viewerId, formerMemberId]) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe("rssHandler", () => {
  it("imports items for the collection owner", async () => {
    const subscription = await subscribe(ownerId, "owner");

    await rssHandler(subscription, feedWithOneItem("owner"));

    expect(await importedLink("owner")).toEqual({ createdById: ownerId });
  });

  it("imports items for a member who can add links", async () => {
    const subscription = await subscribe(writerId, "writer");

    await rssHandler(subscription, feedWithOneItem("writer"));

    expect(await importedLink("writer")).toEqual({ createdById: writerId });
  });

  it("deletes the subscription of a member who can't add links", async () => {
    const subscription = await subscribe(viewerId, "viewer");

    await rssHandler(subscription, feedWithOneItem("viewer"));

    expect(await importedLink("viewer")).toBeNull();
    expect(await subscriptionExists(subscription.id)).toBe(false);
  });

  it("deletes the subscription once the subscriber is removed from the collection", async () => {
    const subscription = await subscribe(formerMemberId, "former");

    await prisma.usersAndCollections.delete({
      where: {
        userId_collectionId: { userId: formerMemberId, collectionId },
      },
    });

    await rssHandler(subscription, feedWithOneItem("former"));

    expect(await importedLink("former")).toBeNull();
    expect(await subscriptionExists(subscription.id)).toBe(false);
  });

  it("deletes the subscription even when the feed has nothing new", async () => {
    const subscription = await prisma.rssSubscription.update({
      where: { id: (await subscribe(viewerId, "quiet")).id },
      data: { lastBuildDate: new Date() },
    });

    await rssHandler(subscription, {
      lastBuildDate: new Date(0).toUTCString(),
      items: [],
    } as any);

    expect(await subscriptionExists(subscription.id)).toBe(false);
  });
});
