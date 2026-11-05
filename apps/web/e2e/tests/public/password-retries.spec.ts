import { APIRequestContext } from "@playwright/test";
import { expect, test } from "../../index";
import { auth, createUser } from "@/e2e/data/api";

// The password createUser gives every account
const password = "password";

const tooManyAttempts =
  /^Too many incorrect passwords\. Please try again in \d+ seconds?\.$/;

async function failLogins(
  request: APIRequestContext,
  username: string,
  count: number
) {
  for (let i = 0; i < count; i++) {
    const response = await request.post("/api/v1/session", {
      data: { username, password: `wrong-password-${i}` },
    });
    expect(response.status()).toBe(400);
  }
}

test.describe(
  "Password retries",
  {
    tag: "@login",
  },
  async () => {
    test("After 15 wrong passwords, the web login asks to wait, even for the right password", async ({
      page,
      request,
      loginPage,
    }) => {
      const user = await createUser(request, "retries-web");
      await failLogins(request, user.username, 15);

      await loginPage.goto();
      await loginPage.usernameInput.fill(user.username);
      await loginPage.passwordInput.fill(password);
      await loginPage.submitLoginButton.click();

      const toast = await loginPage.getLatestToast();
      await expect(toast.locator).toHaveAttribute("data-type", "error");
      await expect(toast.message).toHaveText(tooManyAttempts);
      await expect(loginPage.loginForm).toBeVisible();
    });

    test("After 15 wrong passwords, the session API answers 429 with Retry-After", async ({
      request,
    }) => {
      const user = await createUser(request, "retries-api");
      await failLogins(request, user.username, 15);

      const response = await request.post("/api/v1/session", {
        data: { username: user.username, password },
      });
      expect(response.status()).toBe(429);

      const retryAfter = Number(response.headers()["retry-after"]);
      expect(retryAfter).toBeGreaterThanOrEqual(1);
      expect(retryAfter).toBeLessThanOrEqual(25);
      expect(await response.json()).toEqual({
        response: `Too many incorrect passwords. Please try again in ${retryAfter} second${
          retryAfter === 1 ? "" : "s"
        }.`,
        code: "TOO_MANY_ATTEMPTS",
      });
    });

    test("Wrong passwords for one account don't stop another from signing in", async ({
      request,
      loginPage,
      dashboardPage,
    }) => {
      const target = await createUser(request, "retries-target");
      const other = await createUser(request, "retries-other");
      await failLogins(request, target.username, 15);

      await loginPage.goto();
      await loginPage.usernameInput.fill(other.username);
      await loginPage.passwordInput.fill(password);
      await loginPage.submitLoginButton.click();
      await expect(dashboardPage.container).toBeVisible({ timeout: 15000 });
    });

    test("After 15 wrong old passwords, the password settings page asks to wait", async ({
      page,
      request,
      loginPage,
      dashboardPage,
    }) => {
      const user = await createUser(request, "retries-settings");

      await loginPage.goto();
      await loginPage.usernameInput.fill(user.username);
      await loginPage.passwordInput.fill(password);
      await loginPage.submitLoginButton.click();
      await expect(dashboardPage.container).toBeVisible({ timeout: 15000 });

      for (let i = 0; i < 15; i++) {
        const response = await request.put(`/api/v1/users/${user.id}`, {
          headers: auth(user),
          data: {
            username: user.username,
            oldPassword: `wrong-password-${i}`,
            newPassword: "new-password",
          },
        });
        expect(response.status()).toBe(400);
      }

      await page.goto("/settings/password");
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.nth(0).fill(password);
      await passwordInputs.nth(1).fill("new-password");
      await page.getByRole("button", { name: "Save Changes" }).click();

      const toast = await loginPage.getLatestToast();
      await expect(toast.locator).toHaveAttribute("data-type", "error");
      await expect(toast.message).toHaveText(tooManyAttempts);

      // The password stayed the same
      const session = await request.post("/api/v1/session", {
        data: { username: user.username, password: "new-password" },
      });
      expect(session.status()).not.toBe(200);
      // A new password would have signed out every session, this one included
      const me = await request.get("/api/v1/users/me", { headers: auth(user) });
      expect(me.status()).toBe(200);
    });

    test("14 wrong passwords in a row don't stop the right one", async ({
      request,
      loginPage,
      dashboardPage,
    }) => {
      const user = await createUser(request, "retries-typos");
      await failLogins(request, user.username, 14);

      await loginPage.goto();
      await loginPage.usernameInput.fill(user.username);
      await loginPage.passwordInput.fill(password);
      await loginPage.submitLoginButton.click();
      await expect(dashboardPage.container).toBeVisible({ timeout: 15000 });
    });

    test("After 15 wrong passwords, deleting the account asks to wait and keeps the account", async ({
      page,
      request,
      loginPage,
      dashboardPage,
    }) => {
      const user = await createUser(request, "retries-delete");

      await loginPage.goto();
      await loginPage.usernameInput.fill(user.username);
      await loginPage.passwordInput.fill(password);
      await loginPage.submitLoginButton.click();
      await expect(dashboardPage.container).toBeVisible({ timeout: 15000 });

      await failLogins(request, user.username, 15);

      await page.goto("/settings/account");
      await page.getByRole("button", { name: "Delete Account" }).click();
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole("button", { name: "Delete Your Account" }).click();

      const toast = await loginPage.getLatestToast();
      await expect(toast.locator).toHaveAttribute("data-type", "error");
      await expect(toast.message).toHaveText(tooManyAttempts);

      const me = await request.get("/api/v1/users/me", { headers: auth(user) });
      expect(me.status()).toBe(200);
    });

    test("Once 25 seconds have passed, the right password signs in again", async ({
      request,
      loginPage,
      dashboardPage,
    }) => {
      // Waits out the real delay, so the app's and the database's clocks have to agree
      test.setTimeout(90_000);

      const user = await createUser(request, "retries-wait");
      await failLogins(request, user.username, 15);

      const refused = await request.post("/api/v1/session", {
        data: { username: user.username, password },
      });
      expect(refused.status()).toBe(429);
      const retryAfter = Number(refused.headers()["retry-after"]);

      await new Promise((resolve) =>
        setTimeout(resolve, (retryAfter + 1) * 1000)
      );

      await loginPage.goto();
      await loginPage.usernameInput.fill(user.username);
      await loginPage.passwordInput.fill(password);
      await loginPage.submitLoginButton.click();
      await expect(dashboardPage.container).toBeVisible({ timeout: 15000 });
    });
  }
);
