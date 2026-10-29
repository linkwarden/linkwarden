import { Page, PlaywrightWorkerArgs } from "@playwright/test";
import { expect, test } from "../../index";
import { auth, createUser } from "@/e2e/data/api";

const password = "password";
const newPassword = "new-password";

async function signIn(page: Page, username: string) {
  await page.goto("/login");
  await page.getByTestId("username-input").fill(username);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("submit-login-button").click();
  await expect(page.getByTestId("dashboard-wrapper")).toBeVisible({
    timeout: 15000,
  });
}

// A separate web sign-in, like another browser of the same user
async function signInWithRequest(
  playwright: PlaywrightWorkerArgs["playwright"],
  username: string
) {
  const context = await playwright.request.newContext({
    baseURL: test.info().project.use.baseURL,
  });
  const { csrfToken } = await (await context.get("/api/v1/auth/csrf")).json();
  await context.post("/api/v1/auth/callback/credentials", {
    form: { username, password, csrfToken, json: "true" },
  });
  expect((await context.get("/api/v1/users/me")).status()).toBe(200);

  return context;
}

// The session cookie as an attacker who copied it out of the browser would send it
async function copySessionCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies
    .filter((cookie) => cookie.name.includes("next-auth.session-token"))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

test.describe(
  "Session revocation",
  {
    tag: "@permissions",
  },
  async () => {
    test("Changing the password revokes other sessions and access tokens, but keeps this browser signed in", async ({
      page,
      request,
    }) => {
      const user = await createUser(request, "password-change");
      await signIn(page, user.username);
      const copiedCookie = await copySessionCookie(page);

      const created = await page.request.post("/api/v1/tokens", {
        data: { name: "e2e-token", expires: 0 },
      });
      expect(created.ok()).toBeTruthy();
      const apiToken = (await created.json()).response.secretKey;

      // The form only submits once the account has loaded
      const accountLoaded = page.waitForResponse(
        (res) => res.url().includes(`/api/v1/users/${user.id}`) && res.ok()
      );
      await page.goto("/settings/password");
      await accountLoaded;
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.nth(0).fill(password);
      await passwordInputs.nth(1).fill(newPassword);
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expect(page.getByText("Settings Applied!")).toBeVisible();

      for (const headers of [
        auth({ ...user, token: apiToken }),
        auth(user),
        { cookie: copiedCookie },
      ]) {
        const me = await request.get("/api/v1/users/me", { headers });
        expect(me.status()).toBe(401);
      }

      expect((await page.request.get("/api/v1/users/me")).status()).toBe(200);
      await page.reload();
      await expect(page.locator('input[type="password"]').first()).toBeVisible({
        timeout: 15000,
      });
      await expect(page).toHaveURL(/\/settings\/password/);

      const oldLogin = await request.post("/api/v1/session", {
        data: { username: user.username, password },
      });
      expect(oldLogin.status()).toBe(400);
      const newLogin = await request.post("/api/v1/session", {
        data: { username: user.username, password: newPassword },
      });
      expect(newLogin.ok()).toBeTruthy();
    });

    test("Signing out of the web revokes copies of that session's cookie", async ({
      page,
      request,
      playwright,
    }) => {
      const user = await createUser(request, "web-sign-out");
      await signIn(page, user.username);
      const copiedCookie = await copySessionCookie(page);
      const otherBrowser = await signInWithRequest(playwright, user.username);

      await page
        .locator('button[aria-haspopup="menu"]')
        .filter({ hasText: "web-sign-out" })
        .click();
      await page.getByRole("menuitem", { name: "Logout" }).click();
      await expect(page.getByTestId("login-form")).toBeVisible({
        timeout: 15000,
      });

      const me = await request.get("/api/v1/users/me", {
        headers: { cookie: copiedCookie },
      });
      expect(me.status()).toBe(401);

      const session = await request.get("/api/v1/auth/session", {
        headers: { cookie: copiedCookie },
      });
      expect((await session.json()).user).toBeUndefined();

      // Other sessions of the same user stay signed in
      const appSession = await request.get("/api/v1/users/me", {
        headers: auth(user),
      });
      expect(appSession.status()).toBe(200);
      const otherBrowserMe = await otherBrowser.get("/api/v1/users/me");
      expect(otherBrowserMe.status()).toBe(200);
      await otherBrowser.dispose();
    });

    test("Signing out of the app revokes its session token but not the user's API keys", async ({
      request,
    }) => {
      const user = await createUser(request, "app-sign-out");

      const created = await request.post("/api/v1/tokens", {
        headers: auth(user),
        data: { name: "e2e-token", expires: 0 },
      });
      expect(created.ok()).toBeTruthy();
      const apiKey = {
        ...user,
        token: (await created.json()).response.secretKey,
      };

      // Signing out of the extension with an API key leaves the key alone
      const apiKeySignOut = await request.delete("/api/v1/session", {
        headers: auth(apiKey),
      });
      expect(apiKeySignOut.status()).toBe(404);
      expect(
        (
          await request.get("/api/v1/users/me", { headers: auth(apiKey) })
        ).status()
      ).toBe(200);

      const signOut = await request.delete("/api/v1/session", {
        headers: auth(user),
      });
      expect(signOut.status()).toBe(200);
      expect(
        (
          await request.get("/api/v1/users/me", { headers: auth(user) })
        ).status()
      ).toBe(401);
      expect(
        (
          await request.delete("/api/v1/session", { headers: auth(user) })
        ).status()
      ).toBe(401);

      expect(
        (
          await request.get("/api/v1/users/me", { headers: auth(apiKey) })
        ).status()
      ).toBe(200);
      expect((await request.delete("/api/v1/session")).status()).toBe(401);
    });

    test("Changing the password with a token revokes that token too", async ({
      request,
    }) => {
      const user = await createUser(request, "api-password-change");

      const changed = await request.put(`/api/v1/users/${user.id}`, {
        headers: auth(user),
        data: {
          username: user.username,
          oldPassword: password,
          newPassword,
        },
      });
      expect(changed.status()).toBe(200);
      expect(changed.headers()["set-cookie"]).toBeUndefined();

      const me = await request.get("/api/v1/users/me", { headers: auth(user) });
      expect(me.status()).toBe(401);
    });
  }
);
