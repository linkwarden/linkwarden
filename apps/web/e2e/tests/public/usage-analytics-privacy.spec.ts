import { gunzipSync } from "zlib";
import { BrowserContext, Page, Request, Response } from "@playwright/test";
import { expect, test } from "../../index";
import { auth, createCollection, createUser, TestUser } from "@/e2e/data/api";

const POSTHOG_HOST = "https://posthog-privacy.e2e.test";

// A constant in posthog-js that Linkwarden's own code doesn't contain, so a
// script that has it is posthog-js itself.
const POSTHOG_JS_MARKER = "$posthog_cookieless";

type Captured = { event: string; properties: Record<string, any> };

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

const isEventRequest = (request: Request) =>
  /^\/(e|i\/v0\/e|batch)\/?$/.test(new URL(request.url()).pathname);

const actLikeARealBrowser = (target: Page | BrowserContext) =>
  target.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "webdriver", {
      get: () => false,
    });
    Object.defineProperty(Navigator.prototype, "userAgentData", {
      get: () => undefined,
    });
  });

// Turns usage analytics on for this page or context, like on Linkwarden Cloud,
// and catches everything sent to PostHog.
async function withAnalytics(target: Page | BrowserContext) {
  const requests: Request[] = [];

  await actLikeARealBrowser(target);

  await target.route(
    (url) => url.pathname === "/api/v1/config",
    async (route) => {
      const response = await route.fetch();
      const json = await response.json();

      json.response.POSTHOG_KEY = "phc_e2e_privacy";
      json.response.POSTHOG_HOST = POSTHOG_HOST;

      await route.fulfill({ response, json });
    }
  );

  await target.route(`${POSTHOG_HOST}/**`, async (route) => {
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

// Records every script the page downloads and whether it's posthog-js.
function watchScripts(page: Page) {
  const scripts: { url: string; isPostHog: boolean }[] = [];
  const pending: Promise<void>[] = [];

  page.on("response", (response: Response) => {
    if (response.request().resourceType() !== "script") return;

    pending.push(
      response
        .text()
        .then((body) => {
          scripts.push({
            url: response.url(),
            isPostHog: body.includes(POSTHOG_JS_MARKER),
          });
        })
        .catch(() => {})
    );
  });

  return async () => {
    await Promise.all(pending);
    return scripts;
  };
}

async function login(page: Page, user: TestUser) {
  await page.goto("/login");
  await page.getByTestId("username-input").fill(user.username);
  await page.getByTestId("password-input").fill("password");
  await page.getByTestId("submit-login-button").click();
  await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();
}

async function optOut(
  request: Parameters<typeof createUser>[0],
  user: TestUser
) {
  const off = await request.put(`/api/v1/users/${user.id}/preference`, {
    headers: auth(user),
    data: { shareUsageAnalytics: false },
  });
  expect(off.ok()).toBeTruthy();
}

test.describe("Usage analytics privacy", () => {
  test("Downloads no analytics code and contacts no analytics host without usage analytics", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "analytics-self-hosted");
    const collection = await createCollection(request, owner);
    const scripts = watchScripts(page);
    const appOrigin = new URL(test.info().project.use.baseURL!).origin;
    const offOrigin: string[] = [];

    await actLikeARealBrowser(page);
    page.on("request", (r) => {
      const url = new URL(r.url());
      if (url.origin !== appOrigin) offOrigin.push(url.href);
    });

    await login(page, owner);
    await page.goto(`/collections/${collection.id}`);
    await page.goto("/settings/preference");
    await expect(page.getByText("Link Settings")).toBeVisible();
    await page.mouse.click(600, 400);
    await page.waitForTimeout(3000);

    const downloaded = await scripts();
    expect(downloaded.length).toBeGreaterThan(0);
    expect(downloaded.filter((s) => s.isPostHog)).toEqual([]);
    expect(
      offOrigin.filter((url) =>
        /posthog|\/(e|i\/v0\/e|batch|flags|decide)\/?(\?|$)/.test(url)
      )
    ).toEqual([]);
  });

  test("Downloads posthog-js only once analytics start, and never for an opted-out account", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "analytics-download");
    const scripts = watchScripts(page);
    await withAnalytics(page);

    await page.goto("/login");
    await expect
      .poll(async () => (await scripts()).some((s) => s.isPostHog))
      .toBe(true);

    await login(page, owner);
    await optOut(request, owner);

    const reloaded = watchScripts(page);
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();
    await page.waitForTimeout(2000);

    expect((await reloaded()).filter((s) => s.isPostHog)).toEqual([]);
  });

  test("Cleans every URL on the first page of a visit, including heatmaps and page leaves", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "analytics-first-page");
    const collection = await createCollection(request, owner);
    const analytics = await withAnalytics(page);

    await login(page, owner);
    analytics.requests.length = 0;

    await page.goto(
      `/collections/${collection.id}?q=e2e-first-page-query#e2e-first-page-hash`
    );
    await expect
      .poll(() => analytics.events().map((e) => e.event))
      .toContain("$pageview");

    await page.mouse.click(900, 650);
    await page.mouse.move(920, 660);
    await page.waitForTimeout(700);
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();

    await expect
      .poll(() => analytics.events().map((e) => e.event), { timeout: 20000 })
      .toEqual(expect.arrayContaining(["$pageleave", "$$heatmap"]));

    const sent = JSON.stringify(analytics.events());
    expect(sent).not.toContain("e2e-first-page-query");
    expect(sent).not.toContain("e2e-first-page-hash");
    expect(sent).not.toContain(`/collections/${collection.id}`);
    expect(sent).not.toContain(owner.username);

    for (const { properties } of analytics.events())
      expect(properties).not.toHaveProperty("title");
  });

  test("Sends nothing for an opted-out account that signs in on the login page", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "analytics-off-sign-in");
    const collection = await createCollection(request, owner);
    await optOut(request, owner);
    const analytics = await withAnalytics(page);

    await page.goto("/login");
    await expect
      .poll(() => analytics.events().map((e) => e.properties.$pathname))
      .toContain("/login");

    await page.getByTestId("username-input").fill(owner.username);
    await page.getByTestId("password-input").fill("password");
    await page.getByTestId("submit-login-button").click();
    await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();

    await page.mouse.click(700, 500);
    await page.mouse.move(720, 520);
    await page.waitForTimeout(1000);
    await page.goto(`/collections/${collection.id}`);
    await page.waitForTimeout(6000);

    const pages = analytics
      .events()
      .map((e) => e.properties.$pathname)
      .filter(Boolean);
    expect(pages.filter((path) => path !== "/login")).toEqual([]);
  });

  // Signing out in one tab signs out the others, which then count as an
  // anonymous visitor on the page the opted-out account had open.
  test.fail(
    "Sends nothing from an opted-out account's other tabs when it signs out",
    async ({ browser, request }) => {
      const owner = await createUser(request, "analytics-off-tabs");
      const collection = await createCollection(request, owner);
      await optOut(request, owner);

      const context = await browser.newContext();
      const analytics = await withAnalytics(context);

      const first = await context.newPage();
      await login(first, owner);
      await first.goto(`/collections/${collection.id}`);
      await first.waitForTimeout(1500);

      const second = await context.newPage();
      await second.goto("/dashboard");
      await expect(second.getByTestId("dashboard-wrapper")).toBeVisible();
      analytics.requests.length = 0;

      // Like a slow connection, the redirect to the login page takes a moment
      await context.route(/\/_next\/data\/.+\/login\.json/, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });

      await second.evaluate(async () => {
        const { csrfToken } = await (await fetch("/api/v1/auth/csrf")).json();
        await fetch("/api/v1/auth/signout", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ csrfToken, json: "true" }),
        });
        localStorage.setItem(
          "nextauth.message",
          JSON.stringify({
            event: "session",
            data: { trigger: "signout" },
            timestamp: Math.floor(Date.now() / 1000),
          })
        );
      });

      await first.bringToFront();
      await expect(first).toHaveURL(/\/login/);
      await first.waitForTimeout(5000);

      const pages = analytics
        .events()
        .map((e) => e.properties.$pathname)
        .filter(Boolean);
      await context.close();

      expect(pages.filter((path) => path !== "/login")).toEqual([]);
    }
  );
});
