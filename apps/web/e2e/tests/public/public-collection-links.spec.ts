import { APIRequestContext } from "@playwright/test";
import { expect, test } from "../../index";
import { auth, createUser, TestUser } from "@/e2e/data/api";

const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function createPublicCollection(
  request: APIRequestContext,
  owner: TestUser
) {
  const name = `e2e-public-${unique()}`;

  const created = await request.post("/api/v1/collections", {
    headers: auth(owner),
    data: { name },
  });
  expect(created.ok()).toBeTruthy();
  const { response } = await created.json();

  const shared = await request.put(`/api/v1/collections/${response.id}`, {
    headers: auth(owner),
    data: { id: response.id, name, isPublic: true, members: [] },
  });
  expect(shared.ok()).toBeTruthy();

  return response.id as number;
}

// A public collection is read without signing in, outside the dashboard
// layout, so its page scrolls the window rather than a container. Every link
// still has to show up as the visitor scrolls down.
test.describe("Public collection links", () => {
  test("Scrolling a public collection shows every link", async ({
    page,
    request,
  }) => {
    // Open: the virtualized list only watches its nearest scrolling ancestor,
    // and the public page has none, so rows past the first screen never mount
    // and the next page is never requested (components/VirtualRows.tsx).
    test.fail();

    const owner = await createUser(request, "public-owner");
    const collectionId = await createPublicCollection(request, owner);
    const total = 40;

    for (let i = 0; i < total; i++) {
      // The server never fetches localhost URLs, so creating links makes no outbound requests.
      const created = await request.post("/api/v1/links", {
        headers: auth(owner),
        data: {
          url: `http://localhost/e2e-public-${unique()}`,
          name: `Public link ${String(i).padStart(2, "0")}`,
          collection: { id: collectionId },
        },
      });
      expect(created.ok()).toBeTruthy();
    }

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/public/collections/${collectionId}`);

    const links = page.getByText(/^Public link \d\d$/);
    await expect(links.first()).toBeVisible();

    // Scroll the window to the bottom a few times so every page gets loaded
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(640, 360);
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(300);
    }
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight)
    );

    await expect(links).toHaveCount(total, { timeout: 10000 });
  });
});
