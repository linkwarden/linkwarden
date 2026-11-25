import { APIRequestContext, Locator, Page } from "@playwright/test";
import { expect, test } from "../../index";
import { auth, createUser, TestUser } from "@/e2e/data/api";
import { getLinkPlaceholder } from "@linkwarden/lib/linkPlaceholder";

// Read before anything loads @prisma/client, which fills DATABASE_URL in from
// packages/prisma/.env when it's unset and could point these tests at another
// database
const DATABASE_URL = process.env.DATABASE_URL;

const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const run = unique();

const names = {
  site: `Placeholder site ${run}`,
  sameSite: `Placeholder same site ${run}`,
  otherSite: `Placeholder other site ${run}`,
  pdf: `Placeholder report ${run}.pdf`,
  customIcon: `Placeholder custom icon ${run}`,
  craftedColor: `Placeholder crafted color ${run}`,
  pending: `Placeholder pending ${run}`,
};

type Name = keyof typeof names;

// The server never fetches localhost or private addresses, so creating these
// links makes no outbound requests.
const urls: Record<Name, string> = {
  site: `http://localhost/e2e-placeholder-a-${run}`,
  sameSite: `http://localhost/e2e-placeholder-b-${run}`,
  otherSite: `http://127.0.0.2/e2e-placeholder-${run}`,
  pdf: `http://localhost/e2e-placeholder-pdf-${run}`,
  customIcon: `http://localhost/e2e-placeholder-icon-${run}`,
  craftedColor: `http://localhost/e2e-placeholder-color-${run}`,
  pending: `http://localhost/e2e-placeholder-pending-${run}`,
};

// A color that would close the CSS value it lands in and add an image layer
const beacon = `e2e-beacon-${run}`;
const craftedColor = `red 0%,red)1px,red),url(/${beacon})/*`;

async function createPublicCollection(
  request: APIRequestContext,
  owner: TestUser
) {
  const name = `e2e-placeholders-${run}`;

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

// Sets what the worker would: it doesn't run here, and the server marks links
// it won't fetch as preserved without a preview right away
async function updateLinks(
  updates: { id: number; data: Record<string, unknown> }[]
) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

  try {
    for (const { id, data } of updates)
      await prisma.link.update({ where: { id }, data });
  } finally {
    await prisma.$disconnect();
  }
}

// Clicking a link opens its details instead of the page
async function openLinksInDetails(userId: number) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { linksRouteTo: "DETAILS" },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function open(
  page: Page,
  collectionId: number,
  viewMode: "card" | "list" | "masonry",
  show?: Record<string, boolean>
) {
  await page.addInitScript(
    ([mode, show]) => {
      localStorage.setItem("viewMode", mode as string);
      if (show) localStorage.setItem("show", JSON.stringify(show));
    },
    [viewMode, show] as const
  );
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto(`/public/collections/${collectionId}`);
  await expect(page.getByText(names.site, { exact: true })).toBeVisible();
}

async function login(page: Page, user: TestUser) {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/login");
  await page.getByTestId("username-input").fill(user.username);
  await page.getByTestId("password-input").fill("password");
  await page.getByTestId("submit-login-button").click();
  await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();
}

const card = (page: Page, name: Name) =>
  page
    .locator("div.group.rounded-xl")
    .filter({ has: page.getByText(names[name], { exact: true }) })
    .last();

const banner = (page: Page, name: Name) =>
  card(page, name).locator("div.relative.rounded-t-xl");

// The tinted background in place of the preview
const placeholder = (page: Page, name: Name) =>
  banner(page, name).locator(":scope > div").first();

// The link's icon on top of the banner, which the view settings can hide
const bannerIcon = (page: Page, name: Name) =>
  banner(page, name).locator(":scope > div.absolute");

const listIcon = (page: Page, name: Name) =>
  page
    .locator("[data-index]")
    .filter({ has: page.getByText(names[name], { exact: true }) })
    .locator("div.shrink-0")
    .first();

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const siteColor = (name: Name) =>
  new RegExp(escape(getLinkPlaceholder({ url: urls[name] }).color));

async function expectSiteBanner(background: Locator, name: Name) {
  await expect(background).toHaveAttribute("style", siteColor(name));
  await expect(background).toHaveAttribute("style", /radial-gradient/);
}

// A 1×1 PNG
const favicon = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

test.describe("Link cards without a preview", () => {
  let owner: TestUser;
  let collectionId: number;
  const ids = {} as Record<Name, number>;

  test.beforeAll(async ({ request }) => {
    owner = await createUser(request, "placeholder-owner");
    collectionId = await createPublicCollection(request, owner);

    for (const name of Object.keys(names) as Name[]) {
      const created = await request.post("/api/v1/links", {
        headers: auth(owner),
        data: {
          url: urls[name],
          name: names[name],
          collection: { id: collectionId },
        },
      });
      expect(created.ok()).toBeTruthy();
      ids[name] = (await created.json()).response.id;
    }

    const unavailable = { preview: "unavailable", lastPreserved: new Date() };

    await updateLinks([
      { id: ids.pending, data: { preview: null, lastPreserved: null } },
      { id: ids.site, data: unavailable },
      { id: ids.sameSite, data: unavailable },
      { id: ids.otherSite, data: unavailable },
      { id: ids.pdf, data: { ...unavailable, type: "pdf", url: null } },
      {
        id: ids.customIcon,
        data: {
          ...unavailable,
          icon: "Star",
          iconWeight: "regular",
          color: "#f97316",
        },
      },
      {
        id: ids.craftedColor,
        data: {
          ...unavailable,
          icon: "Star",
          iconWeight: "regular",
          color: craftedColor,
        },
      },
    ]);
  });

  test("A card without a preview keeps a banner as tall as the others", async ({
    page,
  }) => {
    await open(page, collectionId, "card");

    const pending = await banner(page, "pending").boundingBox();
    expect(pending?.height).toBeGreaterThan(0);

    for (const name of ["site", "pdf", "customIcon"] as Name[]) {
      await expect(banner(page, name)).toBeVisible();
      expect((await banner(page, name).boundingBox())?.height).toBe(
        pending?.height
      );
      await expect(
        banner(page, name).locator('img[src*="preview=true"]')
      ).toHaveCount(0);
    }
  });

  test("A card whose preview is still coming shows a skeleton with the link's icon", async ({
    page,
  }) => {
    await open(page, collectionId, "card");

    await expect(
      banner(page, "pending").locator(":scope > .skeleton")
    ).toHaveCount(1);
    await expect(bannerIcon(page, "pending")).toHaveText("L");
  });

  test("Hiding icons hides the icon on a card whose preview is still coming", async ({
    page,
  }) => {
    await open(page, collectionId, "card", { icon: false });

    await expect(
      banner(page, "pending").locator(":scope > .skeleton")
    ).toHaveCount(1);
    await expect(bannerIcon(page, "pending")).toHaveCount(0);
  });

  test("The list view shows the same icons as the cards", async ({ page }) => {
    await open(page, collectionId, "list");

    await expect(listIcon(page, "site")).toHaveText("L");
    await expect(listIcon(page, "site").locator("div[style]")).toHaveAttribute(
      "style",
      siteColor("site")
    );
    await expect(listIcon(page, "site").locator("i")).toHaveCount(0);
    await expect(
      listIcon(page, "pdf").locator("i.bi-file-earmark-pdf")
    ).toBeVisible();
    await expect(listIcon(page, "customIcon").locator("svg")).toBeVisible();
    await expect(listIcon(page, "customIcon").locator("i")).toHaveCount(0);
  });

  test("The masonry view leaves the banner out when there's no preview", async ({
    page,
  }) => {
    await open(page, collectionId, "masonry");

    for (const name of ["site", "pdf", "customIcon"] as Name[]) {
      await expect(card(page, name)).toBeVisible();
      await expect(banner(page, name)).toHaveCount(0);
    }
  });

  test("A card without a preview shows its site's first letter on the site's color", async ({
    page,
  }) => {
    await open(page, collectionId, "card");

    await expectSiteBanner(placeholder(page, "site"), "site");
    await expect(bannerIcon(page, "site")).toHaveText("L");

    // Every link on a site looks the same
    await expect(bannerIcon(page, "sameSite")).toHaveText("L");
    const backgrounds = await Promise.all(
      (["site", "sameSite"] as Name[]).map((name) =>
        placeholder(page, name).evaluate(
          (element) => getComputedStyle(element).backgroundColor
        )
      )
    );
    expect(backgrounds[0]).toBe(backgrounds[1]);

    await expectSiteBanner(placeholder(page, "otherSite"), "otherSite");
    await expect(bannerIcon(page, "otherSite")).toHaveText("1");
  });

  test("A file without a preview shows its type's icon", async ({ page }) => {
    await open(page, collectionId, "card");

    await expect(
      bannerIcon(page, "pdf").locator("i.bi-file-earmark-pdf")
    ).toBeVisible();
    await expect(bannerIcon(page, "pdf")).toHaveText("");
  });

  test("A link's custom icon shows on a banner that keeps its site's color", async ({
    page,
  }) => {
    await open(page, collectionId, "card");

    await expect(bannerIcon(page, "customIcon").locator("svg")).toBeVisible();
    await expect(bannerIcon(page, "customIcon").locator("i")).toHaveCount(0);
    await expectSiteBanner(placeholder(page, "customIcon"), "customIcon");
    await expect(placeholder(page, "customIcon")).not.toHaveAttribute(
      "style",
      /#f97316/
    );
  });

  test("A link's icon color never reaches its banner", async ({ page }) => {
    await open(page, collectionId, "card");

    await expectSiteBanner(placeholder(page, "craftedColor"), "craftedColor");
    await expect(placeholder(page, "craftedColor")).not.toHaveAttribute(
      "style",
      /url\(|red/
    );
  });

  test("Hiding icons hides the icon on a card without a preview too", async ({
    page,
  }) => {
    await open(page, collectionId, "card");
    await expect(bannerIcon(page, "site")).toHaveCount(1);
    await expect(bannerIcon(page, "site")).toHaveText("L");

    await open(page, collectionId, "card", { icon: false });
    await expectSiteBanner(placeholder(page, "site"), "site");
    await expect(bannerIcon(page, "site")).toHaveCount(0);
  });

  test("A favicon takes the letter's place once it loads", async ({ page }) => {
    await page.route(
      (url) =>
        url.pathname === "/api/v1/getFavicon" &&
        url.searchParams.get("url") === new URL(urls.otherSite).origin,
      (route) =>
        route.fulfill({ status: 200, contentType: "image/png", body: favicon })
    );
    await open(page, collectionId, "card");

    const image = bannerIcon(page, "otherSite").locator("img");
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate((element) => (element as HTMLImageElement).naturalWidth)
      )
      .toBeGreaterThan(0);
    await expect(bannerIcon(page, "otherSite")).toHaveText("");
  });

  test("The dashboard's recent links use the same placeholder", async ({
    page,
  }) => {
    await login(page, owner);
    await page.goto("/dashboard");

    await expectSiteBanner(placeholder(page, "site"), "site");
    await expect(bannerIcon(page, "site")).toHaveText("L");
    await expect(
      bannerIcon(page, "pdf").locator("i.bi-file-earmark-pdf")
    ).toHaveCount(1);
    await expect(bannerIcon(page, "customIcon").locator("svg")).toHaveCount(1);

    // Same height as the skeleton of a link that's still being preserved
    await expect(
      banner(page, "pending").locator(":scope > .skeleton")
    ).toHaveCount(1);
    const heights = await Promise.all(
      (["site", "pending"] as Name[]).map((name) =>
        banner(page, name).evaluate(
          (element) => element.getBoundingClientRect().height
        )
      )
    );
    expect(heights[0]).toBeGreaterThan(0);
    expect(heights[0]).toBe(heights[1]);
  });

  test("A link's details show the same banner and icon", async ({ page }) => {
    // The page of a link in a public collection
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`/public/links/${ids.site}`);
    await expectSiteBanner(
      page.locator('div[style*="radial-gradient"]'),
      "site"
    );
    await expect(page.getByText("L", { exact: true })).toBeVisible();

    // The details opened from a card
    await openLinksInDetails(owner.id);
    await login(page, owner);
    await page.addInitScript(() => localStorage.setItem("viewMode", "card"));
    await page.goto(`/collections/${collectionId}`);
    // dnd-kit marks the card aria-disabled where it can't be dragged, which
    // Playwright takes for a disabled button
    await page.getByText(names.site, { exact: true }).click({ force: true });

    const details = page.getByRole("dialog");
    await expect(details.getByText(urls.site)).toBeVisible();
    await expectSiteBanner(
      details.locator('div[style*="radial-gradient"]'),
      "site"
    );
    await expect(details.getByText("L", { exact: true })).toBeVisible();
    await expect(details.locator("i.bi-link-45deg")).toHaveCount(0);
  });

  test("Dragging a link shows its icon", async ({ page }) => {
    await login(page, owner);
    await page.addInitScript(() => localStorage.setItem("viewMode", "card"));
    await page.goto(`/collections/${collectionId}`);

    const box = (await placeholder(page, "site").boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let step = 1; step <= 5; step++)
      await page.mouse.move(x + step * 10, y + step * 10);

    // dnd-kit's overlay
    const overlay = page.locator('div[style*="z-index: 100"]');
    await expect(overlay).toHaveText("L");
    await expect(overlay.locator("i.bi-link-45deg")).toHaveCount(0);

    await page.mouse.move(x, y);
    await page.mouse.up();
    await expect(overlay).toHaveCount(0);
  });

  test("A link's color can't make the page load anything", async ({ page }) => {
    const requested: string[] = [];
    page.on("request", (request) => requested.push(request.url()));

    for (const viewMode of ["card", "list", "masonry"] as const) {
      await open(page, collectionId, viewMode);
      await expect(
        page.getByText(names.craftedColor, { exact: true })
      ).toBeVisible();
    }
    // Give a background image time to start loading
    await page.waitForTimeout(1000);

    expect(requested.filter((url) => url.includes(beacon))).toEqual([]);
  });
});
