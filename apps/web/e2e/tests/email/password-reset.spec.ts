import { Page } from "@playwright/test";
import { randomUUID } from "crypto";
import { expect, test } from "../../index";
import {
  completeVerification,
  messagesTo,
  newActor,
  oidcSignIn,
  register,
  uniqueEmail,
  waitForMessage,
} from "../../support/accounts";

const password = "OldPassw0rd!";
const newPassword = "NewPassw0rd!";

const resetNotice =
  "Resetting your password signs you out on every device and revokes all your access tokens, including the ones used by integrations like Floccus or the browser extension.";
const changeNotice =
  "Changing your password signs you out on every other device and revokes all your access tokens, including the ones used by integrations like Floccus or the browser extension. You'll stay signed in here.";

async function verifiedAccount(email: string) {
  const web = await newActor();
  await register(web, { email, password });
  await web.post("/api/v1/auth/request-verification-email", {
    data: { email },
  });
  expect(
    await completeVerification(
      web,
      email,
      password,
      await waitForMessage(email, 0)
    )
  ).toBeNull();
}

async function requestResetInPage(page: Page, typedEmail: string) {
  await page.goto("/forgot");
  await page.getByPlaceholder("Email").fill(typedEmail);
  await page.getByRole("button", { name: "Send Reset Link" }).click();
  await expect(page.getByText("Email Sent!")).toBeVisible();
}

// Opens the link from the reset email and sets the new password there
async function resetFromEmail(page: Page, message: string) {
  const token = message.match(/reset-password\?token=([0-9a-f]+)/)?.[1];
  expect(token).toBeTruthy();

  await page.goto(`/auth/reset-password?token=${token}`);
  await expect(page.getByText(resetNotice, { exact: true })).toBeVisible();
  await page.getByPlaceholder("New Password").fill(newPassword);
  await page.getByRole("button", { name: "Update Password" }).click();
  await expect(
    page.getByText("Your password has been successfully updated.")
  ).toBeVisible();
}

async function signInInPage(page: Page, username: string, secret: string) {
  await page.goto("/login");
  await page.getByTestId("username-input").fill(username);
  await page.getByTestId("password-input").fill(secret);
  await page.getByTestId("submit-login-button").click();
  await expect(page.getByTestId("dashboard-wrapper")).toBeVisible({
    timeout: 30000,
  });
}

test.describe("Password reset", { tag: "@password-reset" }, () => {
  test("The forgot page resets the password whatever case the email is typed in", async ({
    page,
  }) => {
    const email = uniqueEmail("reset-case");
    await verifiedAccount(email);
    const before = messagesTo(email).length;

    await requestResetInPage(page, `  ${email.toUpperCase()}  `);
    await resetFromEmail(page, await waitForMessage(email, before));

    await signInInPage(page, email, newPassword);
  });

  test("An SSO account can reset its password typing the email the way its provider capitalized it", async ({
    browser,
  }) => {
    test.skip(
      !process.env.E2E_OIDC_URL,
      "Needs E2E_OIDC_URL (support/oidc-provider.mjs)"
    );

    const capitalized = uniqueEmail("Reset-SSO");
    const sso = await newActor();
    expect(
      await oidcSignIn(sso, {
        sub: randomUUID(),
        email: capitalized,
        email_verified: true,
      })
    ).toBeNull();

    // Whichever spelling the account was saved with gets the email
    const sentBefore =
      messagesTo(capitalized).length +
      messagesTo(capitalized.toLowerCase()).length;
    const page = await browser.newPage();
    await requestResetInPage(page, capitalized);

    let message: string | undefined;
    await expect
      .poll(() => {
        const messages = [
          ...messagesTo(capitalized),
          ...messagesTo(capitalized.toLowerCase()),
        ];
        if (messages.length > sentBefore)
          message = messages[messages.length - 1];
        return !!message;
      })
      .toBe(true);

    await resetFromEmail(page, message!);
    await signInInPage(page, capitalized, newPassword);
    await page.close();
  });

  test("Creating a first password for an SSO account doesn't warn about signing out", async ({
    page,
  }) => {
    test.skip(
      !process.env.E2E_OIDC_URL,
      "Needs E2E_OIDC_URL (support/oidc-provider.mjs)"
    );

    await fetch(`${process.env.E2E_OIDC_URL}/__identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sub: randomUUID(),
        email: uniqueEmail("first-password"),
        email_verified: true,
      }),
    });
    await page.goto("/login");
    await page.getByRole("button", { name: "OIDC" }).click();
    await expect(page.getByTestId("dashboard-wrapper")).toBeVisible({
      timeout: 30000,
    });

    // The form only shows once the account has loaded
    const accountLoaded = page.waitForResponse(
      (res) => /\/api\/v1\/users\/\d+$/.test(res.url()) && res.ok()
    );
    await page.goto("/settings/password");
    await accountLoaded;
    await expect(page.locator('input[type="password"]')).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Save Changes" })
    ).toBeVisible();
    await expect(page.getByText(changeNotice, { exact: true })).toHaveCount(0);
  });
});
