import { expect, test } from "../../index";
import {
  auth,
  createCollection,
  createLink,
  createUser,
  roles,
  uniqueTagName,
} from "@/e2e/data/api";

test.describe(
  "Link update permissions",
  {
    tag: "@permissions",
  },
  async () => {
    test("A viewer can't move their own link into a collection shared with them", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const viewer = await createUser(request, "viewer");
      const shared = await createCollection(request, owner, [
        { userId: viewer.id, ...roles.viewer },
      ]);
      const viewerCollection = await createCollection(request, viewer);
      const link = await createLink(request, viewer, viewerCollection.id);

      // Both the real target owner and a forged one (the viewer's own id) must be refused.
      for (const ownerId of [owner.id, viewer.id]) {
        const moved = await request.put(`/api/v1/links/${link.id}`, {
          headers: auth(viewer),
          data: {
            id: link.id,
            name: link.name,
            url: link.url,
            collection: { id: shared.id, ownerId },
            tags: [],
          },
        });
        expect(moved.status()).toBe(401);
      }

      const current = await request.get(`/api/v1/links/${link.id}`, {
        headers: auth(viewer),
      });
      expect((await current.json()).response.collectionId).toBe(
        viewerCollection.id
      );
    });

    test("Bulk edit can't move a link into a collection you don't own", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const viewer = await createUser(request, "viewer");
      const shared = await createCollection(request, owner, [
        { userId: viewer.id, ...roles.viewer },
      ]);
      const viewerCollection = await createCollection(request, viewer);
      const link = await createLink(request, viewer, viewerCollection.id);

      const moved = await request.put("/api/v1/links", {
        headers: auth(viewer),
        data: {
          links: [{ id: link.id }],
          removePreviousTags: false,
          newData: { collectionId: shared.id, tags: [] },
        },
      });
      expect(moved.status()).toBe(400);

      const current = await request.get(`/api/v1/links/${link.id}`, {
        headers: auth(viewer),
      });
      expect((await current.json()).response.collectionId).toBe(
        viewerCollection.id
      );
    });

    test("Tags are created under the collection owner, not a client-supplied ownerId", async ({
      request,
    }) => {
      const attacker = await createUser(request, "attacker");
      const victim = await createUser(request, "victim");
      const victimTag = uniqueTagName("victim");
      const victimCollection = await createCollection(request, victim);
      await createLink(request, victim, victimCollection.id, [
        { name: victimTag },
      ]);

      const attackerCollection = await createCollection(request, attacker);
      const link = await createLink(request, attacker, attackerCollection.id);
      const injectedTag = uniqueTagName("injected");

      const updated = await request.put(`/api/v1/links/${link.id}`, {
        headers: auth(attacker),
        data: {
          id: link.id,
          name: link.name,
          url: link.url,
          collection: { id: attackerCollection.id, ownerId: victim.id },
          tags: [{ name: injectedTag }, { name: victimTag }],
        },
      });
      expect(updated.ok()).toBeTruthy();
      const { response } = await updated.json();
      expect(response.tags).toHaveLength(2);
      for (const tag of response.tags) expect(tag.ownerId).toBe(attacker.id);

      const victimTags = async (search: string) => {
        const res = await request.get(
          `/api/v1/tags?search=${encodeURIComponent(search)}`,
          { headers: auth(victim) }
        );
        return (await res.json()).data.tags;
      };

      expect(await victimTags(injectedTag)).toHaveLength(0);

      const [existing] = await victimTags(victimTag);
      expect(existing._count.links).toBe(1);
    });

    test("An owner can still move a link between their own collections", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const from = await createCollection(request, owner);
      const to = await createCollection(request, owner);
      const link = await createLink(request, owner, from.id);

      const moved = await request.put(`/api/v1/links/${link.id}`, {
        headers: auth(owner),
        data: {
          id: link.id,
          name: link.name,
          url: link.url,
          collection: { id: to.id, ownerId: owner.id },
          tags: [],
        },
      });
      expect(moved.ok()).toBeTruthy();
      expect((await moved.json()).response.collectionId).toBe(to.id);
    });

    test("An admin member's tags on the owner's link belong to the owner", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const admin = await createUser(request, "admin");
      const shared = await createCollection(request, owner, [
        { userId: admin.id, ...roles.admin },
      ]);
      const link = await createLink(request, owner, shared.id);

      const updated = await request.put(`/api/v1/links/${link.id}`, {
        headers: auth(admin),
        data: {
          id: link.id,
          name: link.name,
          url: link.url,
          collection: { id: shared.id, ownerId: owner.id },
          tags: [{ name: uniqueTagName("admin") }],
        },
      });
      expect(updated.ok()).toBeTruthy();
      const { response } = await updated.json();
      expect(response.tags).toHaveLength(1);
      expect(response.tags[0].ownerId).toBe(owner.id);
    });
  }
);
