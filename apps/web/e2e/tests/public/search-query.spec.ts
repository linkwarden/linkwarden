import { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "../../index";
import { auth, createCollection, createUser, TestUser } from "@/e2e/data/api";
import { Sort } from "@linkwarden/types/global";

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

async function createNamedLink(
  request: APIRequestContext,
  owner: TestUser,
  collectionId: number,
  name: string
) {
  // The server never fetches localhost URLs, so creating links makes no outbound requests.
  const created = await request.post("/api/v1/links", {
    headers: auth(owner),
    data: {
      url: `http://localhost/e2e-search-${unique()}`,
      name,
      collection: { id: collectionId },
    },
  });
  expect(created.ok()).toBeTruthy();
}

async function login(page: Page, owner: TestUser) {
  await page.goto("/login");
  await page.getByTestId("username-input").fill(owner.username);
  await page.getByTestId("password-input").fill("password");
  await page.getByTestId("submit-login-button").click();
  await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();
}

// Every search link encodes the query once (the search modal, public tag
// buttons, the browser extension), and the page has to show results for
// exactly that text.
test.describe("Search query", () => {
  test("The search page uses the query as typed, % included", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "searcher");
    const collection = await createCollection(request, owner);
    await createNamedLink(request, owner, collection.id, "Discount 100% off");
    await createNamedLink(request, owner, collection.id, "Code %41 sample");
    await createNamedLink(request, owner, collection.id, "Code A sample");
    await login(page, owner);

    await page.goto("/search?q=" + encodeURIComponent("100%"));
    await expect(page.getByText('Results for "100%"')).toBeVisible();
    await expect(
      page.getByText("Discount 100% off", { exact: true }).first()
    ).toBeVisible();

    // "%41" must not be read as "A".
    await page.goto("/search?q=" + encodeURIComponent("%41"));
    await expect(page.getByText('Results for "%41"')).toBeVisible();
    await expect(
      page.getByText("Code %41 sample", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText("Code A sample", { exact: true })).toHaveCount(
      0
    );
  });

  test("Searching from the search modal keeps %, +, & and #", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "searcher");
    const collection = await createCollection(request, owner);
    const query = "c++ & rust #1 at 100%";
    await createNamedLink(request, owner, collection.id, query);
    await createNamedLink(request, owner, collection.id, "c rust 1 at 100");
    await login(page, owner);

    await page.getByRole("button", { name: "Search for Links" }).click();
    await page.getByPlaceholder("Search for Links").fill(query);
    await page.getByPlaceholder("Search for Links").press("Enter");

    await expect(page).toHaveURL("/search?q=" + encodeURIComponent(query));
    await expect(page.getByText(`Results for "${query}"`)).toBeVisible();
    await expect(page.getByText(query, { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("c rust 1 at 100", { exact: true })
    ).toHaveCount(0);
  });

  test("A public collection search uses the query as typed, % included", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "owner");
    const collectionId = await createPublicCollection(request, owner);
    await createNamedLink(request, owner, collectionId, "Code %41 sample");
    await createNamedLink(request, owner, collectionId, "Code A sample");

    await page.goto(
      `/public/collections/${collectionId}?q=` + encodeURIComponent("%41")
    );

    await expect(page.getByPlaceholder("Search 2 Links")).toHaveValue("%41");
    await expect(
      page.getByText("Code %41 sample", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText("Code A sample", { exact: true })).toHaveCount(
      0
    );

    // Typing the same text into the search bar gets the same results.
    await page.goto(`/public/collections/${collectionId}`);
    await expect(
      page.getByText("Code A sample", { exact: true }).first()
    ).toBeVisible();
    await page.getByPlaceholder("Search 2 Links").fill("%41");
    await page.getByPlaceholder("Search 2 Links").press("Enter");

    await expect(page).toHaveURL(
      `/public/collections/${collectionId}?q=` + encodeURIComponent("%41")
    );
    await expect(
      page.getByText("Code %41 sample", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText("Code A sample", { exact: true })).toHaveCount(
      0
    );
  });

  test("Search results come in best match order until another sort is picked", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "searcher");
    const collection = await createCollection(request, owner);
    await createNamedLink(request, owner, collection.id, "Sort probe alpha");
    await createNamedLink(request, owner, collection.id, "Sort probe beta");
    await login(page, owner);

    // The sort the next search request asks for
    const nextSearchSort = () =>
      page
        .waitForRequest(
          (req) =>
            req.url().includes("/api/v1/search?") &&
            req.url().includes("searchQueryString=")
        )
        .then((req) => new URL(req.url()).searchParams.get("sort"));

    const first = nextSearchSort();
    await page.goto("/search?q=" + encodeURIComponent("sort probe"));
    expect(await first).toBe(String(Sort.BestMatch));
    await expect(
      page.getByText("Sort probe alpha", { exact: true }).first()
    ).toBeVisible();

    await page.locator("button:has(i.bi-chevron-expand)").click();
    await expect(
      page.getByRole("menuitemradio", { name: "Best Match" })
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      page.getByRole("menuitemradio", { name: "Custom Order" })
    ).toHaveCount(0);

    const picked = nextSearchSort();
    await page.getByRole("menuitemradio", { name: "Name (A-Z)" }).click();
    expect(await picked).toBe(String(Sort.NameAZ));

    // The pick holds for the next search, and other lists keep their own sort.
    const again = nextSearchSort();
    await page.goto("/search?q=" + encodeURIComponent("probe"));
    expect(await again).toBe(String(Sort.NameAZ));
    expect(
      await page.evaluate(() => localStorage.getItem("linkSort"))
    ).toBeNull();
  });
});
