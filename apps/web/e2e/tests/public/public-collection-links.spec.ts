import { APIRequestContext, Locator, Page } from "@playwright/test";
import { expect, test } from "../../index";
import { auth, createUser, TestUser } from "@/e2e/data/api";

const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// More than one page of links (PAGINATION_TAKE_COUNT defaults to 50), so the
// list has to load the next page while scrolling
const TOTAL = 60;

async function createCollectionWithLinks(
  request: APIRequestContext,
  owner: TestUser,
  { isPublic }: { isPublic: boolean }
) {
  const name = `e2e-public-${unique()}`;

  const created = await request.post("/api/v1/collections", {
    headers: auth(owner),
    data: { name },
  });
  expect(created.ok()).toBeTruthy();
  const { response } = await created.json();

  if (isPublic) {
    const shared = await request.put(`/api/v1/collections/${response.id}`, {
      headers: auth(owner),
      data: { id: response.id, name, isPublic: true, members: [] },
    });
    expect(shared.ok()).toBeTruthy();
  }

  for (let i = 0; i < TOTAL; i++) {
    // The server never fetches localhost URLs, so creating links makes no outbound requests.
    const link = await request.post("/api/v1/links", {
      headers: auth(owner),
      data: {
        url: `http://localhost/e2e-public-${unique()}`,
        name: `Scroll link ${String(i).padStart(2, "0")}`,
        collection: { id: response.id },
      },
    });
    expect(link.ok()).toBeTruthy();
  }

  return response.id as number;
}

// The lists are virtualized, so rows far above the screen unmount again: keep
// track of every link that was on the page at some point while scrolling down.
async function linksSeenWhileScrolling(page: Page, links: Locator) {
  const seen = new Set<string>();
  const collect = async () => {
    for (const text of await links.allTextContents()) seen.add(text.trim());
  };

  await expect(links.first()).toBeVisible();
  const viewport = page.viewportSize()!;
  await page.mouse.move(viewport.width / 2, viewport.height / 2);

  for (let i = 0; i < 60 && seen.size < TOTAL; i++) {
    await collect();
    await page.mouse.wheel(0, viewport.height / 2);
    await page.waitForTimeout(150);
  }
  // The last page can still be loading
  await expect
    .poll(async () => {
      await collect();
      return seen.size;
    })
    .toBe(TOTAL);

  await expectRowsOnScreenShown(page, links);

  return seen;
}

// Rows fade in as they come into view (150ms), and a row the list doesn't see
// coming stays transparent, which Playwright still counts as visible
async function expectRowsOnScreenShown(page: Page, links: Locator) {
  const opacitiesOnScreen = () =>
    links.evaluateAll((elements) =>
      elements
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return box.bottom > 0 && box.top < window.innerHeight;
        })
        .map(
          (element) =>
            getComputedStyle(element.closest("[data-index]")!).opacity
        )
    );

  await expect
    .poll(async () => {
      const opacities = await opacitiesOnScreen();
      return opacities.length > 0 && opacities.every((o) => o === "1")
        ? "all shown"
        : opacities.join(",");
    })
    .toBe("all shown");
}

const linkNames = (page: Page) => page.getByText(/^Scroll link \d\d$/);

test.describe("Links while scrolling", () => {
  let owner: TestUser;
  let publicCollectionId: number;

  test.beforeAll(async ({ request }) => {
    owner = await createUser(request, "scroll-owner");
    publicCollectionId = await createCollectionWithLinks(request, owner, {
      isPublic: true,
    });
  });

  // A public collection is read outside the dashboard layout, so its page
  // scrolls the window rather than a container.
  for (const viewMode of ["card", "list", "masonry"]) {
    test(`A public collection shows every link while scrolling (${viewMode} view)`, async ({
      page,
    }) => {
      await page.addInitScript(
        (mode) => localStorage.setItem("viewMode", mode),
        viewMode
      );
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`/public/collections/${publicCollectionId}`);
      await expect(linkNames(page).first()).toBeVisible();
      await expectRowsOnScreenShown(page, linkNames(page));

      const seen = await linksSeenWhileScrolling(page, linkNames(page));
      expect(seen.size).toBe(TOTAL);
    });
  }

  test("A public collection shows every link while scrolling on a phone", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/public/collections/${publicCollectionId}`);

    const seen = await linksSeenWhileScrolling(page, linkNames(page));
    expect(seen.size).toBe(TOTAL);
  });

  test("Searching a public collection shows every match while scrolling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(
      `/public/collections/${publicCollectionId}?q=` +
        encodeURIComponent("Scroll link")
    );

    const seen = await linksSeenWhileScrolling(page, linkNames(page));
    expect(seen.size).toBe(TOTAL);
  });

  test("Scrolling back up shows the first links again", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/public/collections/${publicCollectionId}`);
    await linksSeenWhileScrolling(page, linkNames(page));

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(
      page.getByText("Scroll link 59", { exact: true }).first()
    ).toBeVisible();
    await expectRowsOnScreenShown(page, linkNames(page));
  });

  // Inside the dashboard the list scrolls a container, which has to keep
  // working the same way.
  test("A collection in the dashboard shows every link while scrolling", async ({
    page,
    request,
  }) => {
    const collectionId = await createCollectionWithLinks(request, owner, {
      isPublic: false,
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/login");
    await page.getByTestId("username-input").fill(owner.username);
    await page.getByTestId("password-input").fill("password");
    await page.getByTestId("submit-login-button").click();
    await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();

    await page.goto(`/collections/${collectionId}`);
    const seen = await linksSeenWhileScrolling(page, linkNames(page));
    expect(seen.size).toBe(TOTAL);
  });
});
