import { gunzipSync } from "zlib";
import { BrowserContext, Page, Request } from "@playwright/test";
import { expect, test } from "../../index";
import { auth, createCollection, createUser, TestUser } from "@/e2e/data/api";

// Usage analytics in the browser. The instance's config is rewritten to point
// at a fake PostHog host, so nothing leaves the machine and every request the
// page makes to it can be inspected.

const POSTHOG_HOST = "https://posthog.e2e.test";

type Captured = { event: string; properties: Record<string, any> };

// posthog-js sends events as JSON, gzip, or base64 form data
const decode = (request: Request): Captured[] => {
  const body = request.postDataBuffer();
  if (!body?.length) return [];

  let text =
    body[0] === 0x1f && body[1] === 0x8b
      ? gunzipSync(new Uint8Array(body)).toString("utf8")
      : body.toString("utf8");

  if (text.startsWith("data="))
    text = Buffer.from(decodeURIComponent(text.slice(5)), "base64").toString(
      "utf8"
    );

  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : parsed.batch ?? [parsed];
};

const isEventRequest = (request: Request) => {
  const { pathname } = new URL(request.url());
  return /^\/(e|i\/v0\/e|batch)\/?$/.test(pathname);
};

async function withAnalytics(page: Page) {
  const requests: Request[] = [];

  // PostHog drops every event from a browser that reports being automated
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "webdriver", {
      get: () => false,
    });
    Object.defineProperty(Navigator.prototype, "userAgentData", {
      get: () => undefined,
    });
  });

  await page.route(
    (url) => url.pathname === "/api/v1/config",
    async (route) => {
      const response = await route.fetch();
      const json = await response.json();

      json.response.POSTHOG_KEY = "phc_e2e";
      json.response.POSTHOG_HOST = POSTHOG_HOST;

      await route.fulfill({ response, json });
    }
  );

  await page.route(`${POSTHOG_HOST}/**`, async (route) => {
    requests.push(route.request());

    if (route.request().url().endsWith(".js"))
      await route.fulfill({ contentType: "text/javascript", body: "" });
    else await route.fulfill({ json: {} });
  });

  return {
    requests,
    events: () => requests.filter(isEventRequest).flatMap(decode),
  };
}

async function login(page: Page, user: TestUser) {
  await page.goto("/login");
  await page.getByTestId("username-input").fill(user.username);
  await page.getByTestId("password-input").fill("password");
  await page.getByTestId("submit-login-button").click();
  await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();
}

async function nothingStored(context: BrowserContext, page: Page) {
  const cookies = await context.cookies();
  expect(cookies.filter((cookie) => /^ph_|posthog/i.test(cookie.name))).toEqual(
    []
  );

  const storedKeys = await page.evaluate(() => [
    ...Object.keys(localStorage),
    ...Object.keys(sessionStorage),
  ]);
  expect(storedKeys.filter((key) => /^ph_|posthog/i.test(key))).toEqual([]);
}

test.describe("Usage analytics", () => {
  test("Counts page views without storing anything, and without ids or search terms", async ({
    page,
    context,
    request,
  }) => {
    const owner = await createUser(request, "analytics");
    const collection = await createCollection(request, owner);
    const analytics = await withAnalytics(page);

    const pageViews = () =>
      analytics
        .events()
        .filter((e) => e.event === "$pageview")
        .map((e) => new URL(e.properties.$current_url).pathname);

    // PostHog starts once the user's setting has loaded, so each page view is
    // awaited before moving on
    await login(page, owner);
    await expect.poll(pageViews).toContain("/dashboard");

    await page.goto(`/collections/${collection.id}`);
    await expect.poll(pageViews).toContain("/collections/[id]");

    await page.goto("/search?q=e2e-secret-search-term");
    await expect.poll(pageViews).toContain("/search");

    const sent = JSON.stringify(analytics.events());
    expect(sent).not.toContain(`/collections/${collection.id}`);
    expect(sent).not.toContain("e2e-secret-search-term");
    expect(sent).not.toContain(owner.username);

    for (const { properties } of analytics.events())
      expect(properties).not.toHaveProperty("title");

    await nothingStored(context, page);
  });

  test("Records heatmap positions under the cleaned page URL, without page content", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "analytics-heatmap");
    const collection = await createCollection(request, owner);
    const analytics = await withAnalytics(page);

    await login(page, owner);
    await page.goto(`/collections/${collection.id}?q=e2e-heatmap-term`);
    await expect
      .poll(() =>
        analytics
          .events()
          .filter((e) => e.event === "$pageview")
          .map((e) => new URL(e.properties.$current_url).pathname)
      )
      .toContain("/collections/[id]");

    // A click, then a pointer that rests for more than half a second
    await page.mouse.click(900, 650);
    await page.mouse.move(920, 660);
    await page.waitForTimeout(700);

    // Heatmap positions are sent every 5 seconds
    const heatmaps = () =>
      analytics.events().filter((e) => e.event === "$$heatmap");
    const points = () =>
      heatmaps().flatMap((e) =>
        Object.entries(e.properties.$heatmap_data as Record<string, any[]>)
      );

    const collectionUrl = `${new URL(page.url()).origin}/collections/[id]`;
    await expect
      .poll(
        () =>
          points()
            .filter(([url]) => url === collectionUrl)
            .flatMap(([, list]) => list.map((point) => point.type)),
        { timeout: 20000 }
      )
      .toEqual(expect.arrayContaining(["click", "mousemove"]));

    for (const [url, list] of points()) {
      expect(url).not.toMatch(/\/\d+(\/|$)|[?#]/);
      for (const point of list)
        expect(Object.keys(point).sort()).toEqual([
          "target_fixed",
          "type",
          "x",
          "y",
        ]);
    }

    const sent = JSON.stringify(heatmaps());
    expect(sent).not.toContain(`/collections/${collection.id}`);
    expect(sent).not.toContain("e2e-heatmap-term");
  });

  test("Sends nothing once a user turns usage analytics off", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "analytics-off");
    const analytics = await withAnalytics(page);

    await login(page, owner);
    await page.goto("/settings/preference");

    const setting = page.getByLabel("Share usage analytics");
    await expect(setting).toBeChecked();
    await setting.click();
    await expect(page.getByTestId("toast-message")).toHaveText(
      "Settings Applied!"
    );
    await expect(setting).not.toBeChecked();

    const me = await request.get("/api/v1/users/me", { headers: auth(owner) });
    expect((await me.json()).response.shareUsageAnalytics).toBe(false);

    // Leaving the page sends what was queued before the switch was turned
    // off, and the next page load never starts PostHog for this user
    await page.reload();
    await expect(setting).not.toBeChecked();
    analytics.requests.length = 0;

    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();
    await page.goto("/settings/preference");
    await expect(setting).not.toBeChecked();
    await page.waitForTimeout(4000);

    expect(analytics.requests.map((r) => r.url())).toEqual([]);
  });

  test("Shows the setting unchanged when saving it fails", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "analytics-save-fails");
    await withAnalytics(page);
    await login(page, owner);

    await page.route(
      (url) => /^\/api\/v1\/users\/\d+\/preference$/.test(url.pathname),
      (route) =>
        route.fulfill({
          status: 500,
          json: { response: "Something went wrong." },
        })
    );

    await page.goto("/settings/preference");
    const setting = page.getByLabel("Share usage analytics");
    await expect(setting).toBeChecked();
    await setting.click();

    await expect(page.getByTestId("toast-message")).toHaveText(
      "Something went wrong."
    );
    await expect(setting).toBeChecked();

    const me = await request.get("/api/v1/users/me", { headers: auth(owner) });
    expect((await me.json()).response.shareUsageAnalytics).toBe(true);
  });

  test("Turns the setting off with a click made while the account is loading", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "analytics-early-click");
    await withAnalytics(page);
    await login(page, owner);

    // The account loads slowly, so the click lands while the checkbox still
    // shows its placeholder value
    await page.route(
      (url) => /^\/api\/v1\/users\/\d+$/.test(url.pathname),
      async (route) => {
        if (route.request().method() === "GET")
          await new Promise((resolve) => setTimeout(resolve, 3000));
        await route.continue();
      }
    );

    const saved = page.waitForRequest(
      (r) =>
        r.method() === "PUT" &&
        new URL(r.url()).pathname.endsWith("/preference")
    );

    await page.goto("/settings/preference");
    const setting = page.getByLabel("Share usage analytics");
    await expect(setting).toBeChecked();
    await setting.click();

    expect((await saved).postDataJSON()).toEqual({
      shareUsageAnalytics: false,
    });
    await expect(setting).not.toBeChecked();

    const me = await request.get("/api/v1/users/me", { headers: auth(owner) });
    expect((await me.json()).response.shareUsageAnalytics).toBe(false);
  });

  test("Hides the setting on instances without usage analytics", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "analytics-none");

    await login(page, owner);
    await page.goto("/settings/preference");
    await expect(page.getByText("Link Settings")).toBeVisible();

    await expect(page.getByLabel("Share usage analytics")).toHaveCount(0);
  });
});
