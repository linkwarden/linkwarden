import { expect, test } from "../../index";
import {
  createCollection,
  createLink,
  createUser,
  readPdf,
  roles,
  uploadPdf,
} from "@/e2e/data/api";

test.describe(
  "Archive upload permissions",
  {
    tag: "@permissions",
  },
  async () => {
    test("A contributor can't replace the archive of someone else's link", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const contributor = await createUser(request, "contributor");
      const collection = await createCollection(request, owner, [
        { userId: contributor.id, ...roles.contributor },
      ]);
      const link = await createLink(request, owner, collection.id);

      expect(
        (await uploadPdf(request, owner, link.id, "OWNER_ORIGINAL")).ok()
      ).toBeTruthy();

      const replaced = await uploadPdf(
        request,
        contributor,
        link.id,
        "CONTRIBUTOR_REPLACEMENT"
      );
      expect(replaced.status()).toBe(400);

      const archive = await readPdf(request, owner, link.id);
      expect(archive).toContain("OWNER_ORIGINAL");
      expect(archive).not.toContain("CONTRIBUTOR_REPLACEMENT");
    });

    test("A viewer can't upload an archive", async ({ request }) => {
      const owner = await createUser(request, "owner");
      const viewer = await createUser(request, "viewer");
      const collection = await createCollection(request, owner, [
        { userId: viewer.id, ...roles.viewer },
      ]);
      const link = await createLink(request, owner, collection.id);

      const uploaded = await uploadPdf(
        request,
        viewer,
        link.id,
        "VIEWER_UPLOAD"
      );
      expect(uploaded.status()).toBe(400);
    });

    test("A contributor can upload an archive to a link they created", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const contributor = await createUser(request, "contributor");
      const collection = await createCollection(request, owner, [
        { userId: contributor.id, ...roles.contributor },
      ]);
      const link = await createLink(request, contributor, collection.id);

      const uploaded = await uploadPdf(
        request,
        contributor,
        link.id,
        "CONTRIBUTOR_OWN"
      );
      expect(uploaded.ok()).toBeTruthy();
      expect(await readPdf(request, contributor, link.id)).toContain(
        "CONTRIBUTOR_OWN"
      );
    });

    test("An admin member can replace the archive of the owner's link", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const admin = await createUser(request, "admin");
      const collection = await createCollection(request, owner, [
        { userId: admin.id, ...roles.admin },
      ]);
      const link = await createLink(request, owner, collection.id);

      expect(
        (await uploadPdf(request, owner, link.id, "OWNER_ORIGINAL")).ok()
      ).toBeTruthy();

      const replaced = await uploadPdf(
        request,
        admin,
        link.id,
        "ADMIN_REPLACEMENT"
      );
      expect(replaced.ok()).toBeTruthy();
      expect(await readPdf(request, owner, link.id)).toContain(
        "ADMIN_REPLACEMENT"
      );
    });
  }
);
