import { meiliClient } from "@linkwarden/lib/meilisearchClient";
import { delay } from "@linkwarden/lib/utils";
import { prisma } from "@linkwarden/prisma";
import { Prisma } from "@linkwarden/prisma/client";

// Takes the links of users who've been without a subscription or trial for a
// while out of Meilisearch, where they'd otherwise sit for good, as the
// indexing worker only looks at links by users who have one. Nothing is
// deleted from the database: the links are marked as unindexed, so they're
// indexed again if the user comes back, and their public collections are made
// private, since the search on a public page reads from the index too.

const DAY = 86400000;

// How long a user has to be without a subscription or trial
const UNSUBSCRIBED_DAYS = 30;
const HOURS_BETWEEN_RUNS = 24;
const USERS_PER_PAGE = 500;
const COLLECTIONS_PER_PAGE = 500;
const DOCUMENTS_PER_BATCH = 1000;
const IDS_PER_QUERY = 10000;

const subscriptionSelect = {
  active: true,
  currentPeriodEnd: true,
  updatedAt: true,
} satisfies Prisma.SubscriptionSelect;

const billingSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  subscriptions: { select: subscriptionSelect },
  parentSubscription: { select: subscriptionSelect },
} satisfies Prisma.UserSelect;

type BillingUser = Prisma.UserGetPayload<{ select: typeof billingSelect }>;

type SharedWith = { ownerId: number; members: { userId: number }[] };

// Whether a user has been without a subscription or trial for over
// UNSUBSCRIBED_DAYS. Every way of having one has to be over for that long: the
// trial, their own subscription, and the one they have a seat on.
export function isUnsubscribed(
  user: BillingUser,
  now: number,
  trialDays: number
) {
  const cutoff = now - UNSUBSCRIBED_DAYS * DAY;

  // The day a subscription turned inactive isn't stored. It can't be later
  // than the row's last change, and the paid period has to be over by then
  // too. An active subscription never counts, whatever its dates say.
  const ended = (subscription: BillingUser["subscriptions"]) =>
    !subscription ||
    (subscription.active === false &&
      subscription.currentPeriodEnd.getTime() <= cutoff &&
      subscription.updatedAt.getTime() <= cutoff);

  return (
    // The extra day is the one the web app adds to the trial
    user.createdAt.getTime() + (trialDays + 1) * DAY <= cutoff &&
    // Being taken off someone's subscription only shows as a change to the
    // account, so a recently changed one is left for later
    user.updatedAt.getTime() <= cutoff &&
    ended(user.subscriptions) &&
    ended(user.parentSubscription)
  );
}

// Nobody who can search the collection has a subscription or trial
const isAbandoned = (collection: SharedWith, unsubscribed: Set<number>) =>
  unsubscribed.has(collection.ownerId) &&
  collection.members.every((member) => unsubscribed.has(member.userId));

// One run over every user. With `enabled` off it changes nothing and only
// counts what it would do.
export async function cleanUpIndex(enabled: boolean) {
  if (!meiliClient) throw new Error("Meilisearch isn't set up.");

  const index = meiliClient.index("links");
  const now = Date.now();

  const trialDays = Number(process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS || 14);
  if (!(trialDays >= 0))
    throw new Error(
      `NEXT_PUBLIC_TRIAL_PERIOD_DAYS isn't a number of days: ${process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS}`
    );

  // Read again right before every change, so someone who just subscribed isn't
  // acted on from an older read
  const getUnsubscribedIds = async (userIds: number[]) => {
    const unsubscribed = new Set<number>();

    for (let i = 0; i < userIds.length; i += IDS_PER_QUERY) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds.slice(i, i + IDS_PER_QUERY) } },
        select: billingSelect,
      });

      for (const user of users)
        if (isUnsubscribed(user, now, trialDays)) unsubscribed.add(user.id);
    }

    return unsubscribed;
  };

  const usersOf = (collections: SharedWith[]) =>
    Array.from(
      new Set(
        collections.flatMap((collection) => [
          collection.ownerId,
          ...collection.members.map((member) => member.userId),
        ])
      )
    );

  const makeCollectionsPrivate = async (ownerIds: number[]) => {
    const madePrivate: number[] = [];
    let lastCollectionId = 0;

    while (true) {
      const collections = await prisma.collection.findMany({
        where: {
          id: { gt: lastCollectionId },
          ownerId: { in: ownerIds },
          isPublic: true,
        },
        orderBy: { id: "asc" },
        take: COLLECTIONS_PER_PAGE,
        select: {
          id: true,
          ownerId: true,
          members: { select: { userId: true } },
        },
      });

      if (collections.length === 0) break;
      lastCollectionId = collections[collections.length - 1].id;

      const unsubscribed = await getUnsubscribedIds(usersOf(collections));
      const collectionIds = collections
        .filter((collection) => isAbandoned(collection, unsubscribed))
        .map((collection) => collection.id);

      if (collectionIds.length === 0) continue;

      if (enabled)
        await prisma.$transaction([
          prisma.collection.updateMany({
            where: { id: { in: collectionIds } },
            data: { isPublic: false },
          }),
          // Like when a collection is edited, so a document that stays in the
          // index is sent again and stops saying it's public
          prisma.link.updateMany({
            where: {
              collectionId: { in: collectionIds },
              indexVersion: { not: null },
            },
            data: { indexVersion: null },
          }),
        ]);

      // Logged with their ids, as nothing else records which ones were public
      console.log(
        "\x1b[34m%s\x1b[0m",
        `${enabled ? "Made" : "Would make"} ${
          collectionIds.length
        } public collection${
          collectionIds.length === 1 ? "" : "s"
        } of unsubscribed users private: ${collectionIds.join(", ")}`
      );

      madePrivate.push(...collectionIds);
    }

    return madePrivate;
  };

  // Which of the links behind these documents can go. A link stays when
  // anyone who can search it, or the user who saved it, has a subscription or
  // trial or had one in the last UNSUBSCRIBED_DAYS. The indexing worker goes by
  // who saved the link, so it would send that one right back.
  const getClearableLinks = async (
    documentIds: number[],
    seenAsPrivate: Set<number>
  ) => {
    const links = await prisma.link.findMany({
      where: { id: { in: documentIds } },
      select: {
        id: true,
        createdById: true,
        collection: {
          select: {
            id: true,
            isPublic: true,
            ownerId: true,
            members: { select: { userId: true } },
          },
        },
      },
    });

    const unsubscribed = await getUnsubscribedIds(
      Array.from(
        new Set([
          ...usersOf(links.map((link) => link.collection)),
          ...links.flatMap((link) => link.createdById ?? []),
        ])
      )
    );

    return links.filter(
      (link) =>
        // A public page searches the index, so its links stay until the
        // collection is private
        (!link.collection.isPublic || seenAsPrivate.has(link.collection.id)) &&
        isAbandoned(link.collection, unsubscribed) &&
        (link.createdById === null || unsubscribed.has(link.createdById))
    );
  };

  const clearLinks = async (linkIds: number[]) => {
    const markAsUnindexed = () =>
      prisma.link.updateMany({
        where: { id: { in: linkIds }, indexVersion: { not: null } },
        data: { indexVersion: null },
      });

    // Before the documents are deleted: if the worker stops in between, the
    // next run finds them in Meilisearch again. The other way around, the
    // links would stay marked as indexed with nothing in the index.
    await markAsUnindexed();

    const task = await index.deleteDocuments(linkIds);
    const result = await index.waitForTask(task.taskUid, {
      timeOutMs: Number(process.env.MEILI_TIMEOUT) || 1000000,
    });

    if (result.status !== "succeeded")
      throw new Error(
        `Deleting task ${task.taskUid} ${result.status}: ${
          result.error?.message ?? "no error message"
        }`
      );

    // If the user subscribed just now and the indexing worker sent one of
    // these before the deletion ran, it's marked as indexed while its document
    // is gone. Unmarking it again has it sent once more.
    await markAsUnindexed();
  };

  const stats = {
    users: 0,
    owners: new Set<number>(),
    links: 0,
    collections: 0,
  };
  let lastUserId = 0;

  while (true) {
    const users = await prisma.user.findMany({
      where: { id: { gt: lastUserId } },
      orderBy: { id: "asc" },
      take: USERS_PER_PAGE,
      select: billingSelect,
    });

    if (users.length === 0) break;
    lastUserId = users[users.length - 1].id;

    const ownerIds = users
      .filter((user) => isUnsubscribed(user, now, trialDays))
      .map((user) => user.id);

    if (ownerIds.length === 0) continue;
    stats.users += ownerIds.length;

    const madePrivate = await makeCollectionsPrivate(ownerIds);
    stats.collections += madePrivate.length;

    // When only counting, the collections above are still public
    const seenAsPrivate = new Set(enabled ? [] : madePrivate);

    // Meilisearch is asked what it holds for these users, instead of going by
    // `indexVersion`, which is also empty on a link that's waiting to be
    // indexed again while its old document is still there
    const filter = `collectionOwnerId IN [${ownerIds.join(", ")}]`;
    let offset = 0;
    let justCleared = new Set<number>();

    while (true) {
      const { results } = await index.getDocuments<{ id: number }>({
        filter,
        fields: ["id"],
        limit: DOCUMENTS_PER_BATCH,
        offset,
      });

      if (results.length === 0) break;

      const documentIds = results
        .map((document) => Number(document.id))
        .filter((id) => Number.isInteger(id));

      // Would otherwise go around forever
      if (documentIds.some((id) => justCleared.has(id)))
        throw new Error(
          "Meilisearch still has documents it reported as deleted."
        );

      const links = await getClearableLinks(documentIds, seenAsPrivate);
      const linkIds = links.map((link) => link.id);

      if (enabled && linkIds.length > 0) {
        await clearLinks(linkIds);

        console.log(
          "\x1b[34m%s\x1b[0m",
          `Removed ${linkIds.length} link${
            linkIds.length === 1 ? "" : "s"
          } of unsubscribed users from the index.`
        );
      }

      stats.links += linkIds.length;
      for (const link of links) stats.owners.add(link.collection.ownerId);

      // The deleted documents are gone from the next page, the ones that stay
      // have to be skipped
      justCleared = new Set(enabled ? linkIds : []);
      offset += enabled ? results.length - linkIds.length : results.length;

      if (results.length < DOCUMENTS_PER_BATCH) break;
    }
  }

  return {
    users: stats.users,
    owners: stats.owners.size,
    links: stats.links,
    collections: stats.collections,
  };
}

export async function startIndexCleanup() {
  // Without billing everyone's links are indexed, so there's nothing to clear
  if (!meiliClient || !process.env.STRIPE_SECRET_KEY) return;

  // Until this is set, a run only logs what it would do
  const enabled = process.env.UNSUBSCRIBED_INDEX_CLEANUP === "true";

  console.log(
    "\x1b[34m%s\x1b[0m",
    `Starting index cleanup${enabled ? "" : " (log only)"}...`
  );

  while (true) {
    try {
      const { users, owners, links, collections } = await cleanUpIndex(enabled);

      console.log(
        "\x1b[34m%s\x1b[0m",
        `Index cleanup${enabled ? "" : " (log only)"}: ${users} user${
          users === 1 ? "" : "s"
        } unsubscribed for over ${UNSUBSCRIBED_DAYS} days, ${links} link${
          links === 1 ? "" : "s"
        } of ${owners} of them ${
          enabled ? "removed" : "would be removed"
        } from the index, ${collections} public collection${
          collections === 1 ? "" : "s"
        } ${enabled ? "made private." : "would be made private."}${
          enabled ? "" : " Set UNSUBSCRIBED_INDEX_CLEANUP=true to do it."
        }`
      );
    } catch (err) {
      console.error("\x1b[34m%s\x1b[0m", `Error cleaning up the index:`, err);
    }

    await delay(HOURS_BETWEEN_RUNS * 3600);
  }
}
