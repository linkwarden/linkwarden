import { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "../../index";
import { auth, createLink, createUser, roles, TestUser } from "@/e2e/data/api";

// Read before anything loads @prisma/client, which fills DATABASE_URL in from
// packages/prisma/.env when it's unset and could point these tests at another
// database
const DATABASE_URL = process.env.DATABASE_URL;

async function createNestedCollection(
  request: APIRequestContext,
  owner: TestUser,
  parentId?: number
) {
  const name = `e2e-nested-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const created = await request.post("/api/v1/collections", {
    headers: auth(owner),
    data: { name, parentId },
  });
  expect(created.ok()).toBeTruthy();
  const { response } = await created.json();

  return { id: response.id as number, name };
}

function moveCollection(
  request: APIRequestContext,
  owner: TestUser,
  collection: { id: number; name: string },
  parentId: number | "root"
) {
  return request.put(`/api/v1/collections/${collection.id}`, {
    headers: auth(owner),
    data: { id: collection.id, name: collection.name, parentId, members: [] },
  });
}

function shareCollection(
  request: APIRequestContext,
  owner: TestUser,
  collection: { id: number; name: string },
  member: TestUser
) {
  return request.put(`/api/v1/collections/${collection.id}`, {
    headers: auth(owner),
    data: {
      id: collection.id,
      name: collection.name,
      members: [{ userId: member.id, ...roles.admin }],
    },
  });
}

async function parentOf(
  request: APIRequestContext,
  owner: TestUser,
  id: number
) {
  const current = await request.get(`/api/v1/collections/${id}`, {
    headers: auth(owner),
  });
  return (await current.json()).response.parentId as number | null;
}

// Saves a parent the API would refuse, like a cycle saved before it refused them
async function setParentInDatabase(id: number, parentId: number) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

  try {
    await prisma.collection.update({ where: { id }, data: { parentId } });
  } finally {
    await prisma.$disconnect();
  }
}

async function login(page: Page, owner: TestUser) {
  await page.goto("/login");
  await page.getByTestId("username-input").fill(owner.username);
  await page.getByTestId("password-input").fill("password");
  await page.getByTestId("submit-login-button").click();
  await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();
}

function sidebarEntry(page: Page, collection: { id: number; name: string }) {
  return page
    .locator(`a[href="/collections/${collection.id}"]`)
    .filter({ hasText: collection.name })
    .first();
}

// The collection picker in the New Link modal, opened from the sidebar's
// button, whose name starts with an icon
async function openCollectionPicker(page: Page) {
  await page.getByRole("button", { name: /^\W*New Link$/ }).click();
  await page
    .getByTestId("modal-container")
    .locator(".react-select__control")
    .first()
    .click();

  return page.locator(".react-select__menu");
}

// Renames the collection open on the page with the edit modal, which sends the
// whole collection, its parent included
async function renameFromEditModal(page: Page, name: string) {
  // The page's own menu, not the one on each sub-collection's card
  await page.locator('i[title="More"][aria-haspopup="menu"]').click();
  await page.getByRole("menuitem", { name: /Edit Collection Info/ }).click();
  const modal = page.getByTestId("modal-container");
  await modal.getByPlaceholder("e.g. Example Collection").fill(name);
  await modal.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Updated!")).toBeVisible();
}

test.describe(
  "Collection parents",
  {
    tag: "@permissions",
  },
  async () => {
    test("A collection can't be moved into itself or one of its sub-collections", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const a = await createNestedCollection(request, owner);
      const b = await createNestedCollection(request, owner, a.id);
      const c = await createNestedCollection(request, owner, b.id);

      for (const parentId of [a.id, b.id, c.id]) {
        const moved = await moveCollection(request, owner, a, parentId);
        expect(moved.status()).toBe(400);
      }
      expect(await parentOf(request, owner, a.id)).toBeNull();

      // Closing a cycle in two steps is refused too
      const d = await createNestedCollection(request, owner);
      const e = await createNestedCollection(request, owner);
      expect((await moveCollection(request, owner, d, e.id)).status()).toBe(
        200
      );
      expect((await moveCollection(request, owner, e, d.id)).status()).toBe(
        400
      );
      expect(await parentOf(request, owner, e.id)).toBeNull();
    });

    test("A collection can still move between branches and back to the top level", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const a = await createNestedCollection(request, owner);
      const b = await createNestedCollection(request, owner, a.id);
      const c = await createNestedCollection(request, owner, a.id);

      expect((await moveCollection(request, owner, c, b.id)).status()).toBe(
        200
      );
      expect(await parentOf(request, owner, c.id)).toBe(b.id);

      expect((await moveCollection(request, owner, c, "root")).status()).toBe(
        200
      );
      expect(await parentOf(request, owner, c.id)).toBeNull();
    });

    test("The sidebar opens every parent of a nested collection and counts the links below it", async ({
      page,
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const a = await createNestedCollection(request, owner);
      const b = await createNestedCollection(request, owner, a.id);
      const c = await createNestedCollection(request, owner, b.id);
      await createLink(request, owner, c.id);

      await login(page, owner);
      await page.goto(`/collections/${c.id}`);

      for (const collection of [a, b, c]) {
        await expect(sidebarEntry(page, collection)).toBeVisible();
      }
      await expect(sidebarEntry(page, a).locator("div.drop-shadow")).toHaveText(
        "1"
      );
    });

    test("The sidebar counts a link once after its collection moves under a newer one", async ({
      page,
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const child = await createNestedCollection(request, owner);
      const grandchild = await createNestedCollection(request, owner, child.id);
      await createLink(request, owner, grandchild.id);
      const parent = await createNestedCollection(request, owner);

      // The parent now sorts after the collections below it
      expect(
        (await moveCollection(request, owner, child, parent.id)).status()
      ).toBe(200);

      await login(page, owner);
      await page.goto(`/collections/${grandchild.id}`);

      for (const collection of [parent, child, grandchild]) {
        await expect(
          sidebarEntry(page, collection).locator("div.drop-shadow")
        ).toHaveText("1");
      }
    });

    test("The collection picker shows a nested collection's full path, top level first", async ({
      page,
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const path = [await createNestedCollection(request, owner)];
      for (let level = 1; level < 5; level++) {
        path.push(
          await createNestedCollection(request, owner, path[level - 1].id)
        );
      }
      const deepest = path[path.length - 1];

      await login(page, owner);
      await page.goto(`/collections/${deepest.id}`);

      const menu = await openCollectionPicker(page);
      await page.keyboard.type(deepest.name);
      await expect(menu).toContainText(path.map((c) => c.name).join(" > "));
    });

    test("Renaming a sub-collection keeps it under its parent", async ({
      page,
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const parent = await createNestedCollection(request, owner);
      const child = await createNestedCollection(request, owner, parent.id);

      await login(page, owner);
      await page.goto(`/collections/${child.id}`);
      await renameFromEditModal(page, `${child.name}-renamed`);

      const current = await request.get(`/api/v1/collections/${child.id}`, {
        headers: auth(owner),
      });
      const { response } = await current.json();
      expect(response.name).toBe(`${child.name}-renamed`);
      expect(response.parentId).toBe(parent.id);
    });

    test("A collection saved in a parent cycle can still be renamed", async ({
      page,
      request,
    }) => {
      test.skip(!DATABASE_URL, "Needs DATABASE_URL to save a cycle");

      const owner = await createUser(request, "owner");
      const x = await createNestedCollection(request, owner);
      const y = await createNestedCollection(request, owner, x.id);
      await setParentInDatabase(x.id, y.id);

      await login(page, owner);
      await page.goto(`/collections/${x.id}`);
      await renameFromEditModal(page, `${x.name}-renamed`);

      const current = await request.get(`/api/v1/collections/${x.id}`, {
        headers: auth(owner),
      });
      const { response } = await current.json();
      expect(response.name).toBe(`${x.name}-renamed`);
      expect(response.parentId).toBe(y.id);
    });

    test("Only the owner can move a collection, and only under collections they own", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const member = await createUser(request, "member");
      const stranger = await createUser(request, "stranger");
      const a = await createNestedCollection(request, owner);
      const b = await createNestedCollection(request, owner);
      const membersOwn = await createNestedCollection(request, member);
      expect(
        (await shareCollection(request, owner, a, member)).ok()
      ).toBeTruthy();
      expect(
        (await shareCollection(request, member, membersOwn, owner)).ok()
      ).toBeTruthy();

      expect((await moveCollection(request, stranger, a, b.id)).status()).toBe(
        401
      );
      expect((await moveCollection(request, member, a, b.id)).status()).toBe(
        401
      );
      expect(
        (await moveCollection(request, member, a, membersOwn.id)).status()
      ).toBe(401);
      // Being a member of a collection isn't enough to move one under it
      expect(
        (await moveCollection(request, owner, a, membersOwn.id)).status()
      ).toBe(403);

      expect(await parentOf(request, owner, a.id)).toBeNull();
    });

    test("A parentId that isn't a collection id moves nothing", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const a = await createNestedCollection(request, owner);
      const b = await createNestedCollection(request, owner);

      for (const parentId of [String(b.id), [b.id], { id: b.id }, true]) {
        const moved = await request.put(`/api/v1/collections/${a.id}`, {
          headers: auth(owner),
          data: { id: a.id, name: a.name, parentId, members: [] },
        });
        expect(moved.status()).toBe(400);
      }

      expect((await moveCollection(request, owner, a, -b.id)).status()).toBe(
        403
      );

      expect(await parentOf(request, owner, a.id)).toBeNull();
    });

    // Prisma drops the fraction from an id, but the cycle check compares ids
    // exactly, so a fractional id would get a move past it
    test("A fractional id doesn't get a move past the cycle check", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const a = await createNestedCollection(request, owner);
      const b = await createNestedCollection(request, owner, a.id);

      const underItself = await moveCollection(request, owner, a, a.id + 0.5);
      expect(underItself.status()).toBe(400);

      const underItsChild = await request.put(`/api/v1/collections/${a.id}.5`, {
        headers: auth(owner),
        data: { id: a.id, name: a.name, parentId: b.id, members: [] },
      });
      expect(underItsChild.status()).toBe(401);

      const deleted = await request.delete(`/api/v1/collections/${a.id}.5`, {
        headers: auth(owner),
      });
      expect(deleted.status()).toBe(401);

      const created = await request.post("/api/v1/collections", {
        headers: auth(owner),
        data: { name: "e2e-fractional", parentId: a.id + 0.5 },
      });
      expect(created.status()).toBe(400);

      expect(await parentOf(request, owner, a.id)).toBeNull();
      expect(await parentOf(request, owner, b.id)).toBe(a.id);
    });

    test("Deleting a sub-collection removes everything below it and leaves its parent", async ({
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const stranger = await createUser(request, "stranger");
      const a = await createNestedCollection(request, owner);
      const b = await createNestedCollection(request, owner, a.id);
      const c = await createNestedCollection(request, owner, b.id);
      await createLink(request, owner, c.id);

      const refused = await request.delete(`/api/v1/collections/${b.id}`, {
        headers: auth(stranger),
      });
      expect(refused.status()).toBe(401);

      const deleted = await request.delete(`/api/v1/collections/${b.id}`, {
        headers: auth(owner),
      });
      expect(deleted.status()).toBe(200);

      const remaining = await request.get("/api/v1/collections", {
        headers: auth(owner),
      });
      const ids = (await remaining.json()).response.map(
        (collection: { id: number }) => collection.id
      );
      expect(ids).toContain(a.id);
      expect(ids).not.toContain(b.id);
      expect(ids).not.toContain(c.id);
      expect(await parentOf(request, owner, a.id)).toBeNull();
    });

    test("The collection picker shows a shared sub-collection by its own name when its parent isn't shared", async ({
      page,
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const member = await createUser(request, "member");
      const parent = await createNestedCollection(request, owner);
      const child = await createNestedCollection(request, owner, parent.id);
      expect(
        (await shareCollection(request, owner, child, member)).ok()
      ).toBeTruthy();

      await login(page, member);

      const menu = await openCollectionPicker(page);
      await page.keyboard.type(child.name);
      await expect(menu).toContainText(child.name);
      await expect(menu).not.toContainText(`> ${child.name}`);
      await expect(menu).not.toContainText(parent.name);
    });

    test("The sidebar and collection picker still load when saved collections form a parent cycle", async ({
      page,
      request,
    }) => {
      const owner = await createUser(request, "owner");
      const top = await createNestedCollection(request, owner);
      const x = await createNestedCollection(request, owner);
      const y = await createNestedCollection(request, owner);

      // The API won't save a cycle any more, so stand in for one saved before
      // it refused them by rewriting the collection list on its way in
      await page.route(
        (url) => url.pathname === "/api/v1/collections",
        async (route) => {
          if (route.request().method() !== "GET") return route.continue();

          const response = await route.fetch();
          const json = await response.json();

          for (const collection of json.response) {
            const parent =
              collection.id === x.id ? y : collection.id === y.id ? x : null;

            if (parent) {
              collection.parentId = parent.id;
              collection.parent = { id: parent.id, name: parent.name };
            }
          }

          await route.fulfill({ response, json });
        }
      );

      const errors: Error[] = [];
      page.on("pageerror", (error) => errors.push(error));

      await login(page, owner);
      await expect(sidebarEntry(page, top)).toBeVisible();

      // Opening a collection in the cycle walks up its parents to expand them
      await page.goto(`/collections/${x.id}`);
      await expect(sidebarEntry(page, top)).toBeVisible();

      // The collection picker names each one by its path through the other,
      // without coming back round to itself
      const menu = await openCollectionPicker(page);
      await expect(menu).toContainText(`${y.name} > ${x.name}`);
      await expect(menu).toContainText(`${x.name} > ${y.name}`);
      await expect(menu).not.toContainText(`${x.name} > ${y.name} > ${x.name}`);

      expect(errors).toEqual([]);
    });
  }
);
