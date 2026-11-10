import { PrismaClient } from "@prisma/client";
import { Page } from "@playwright/test";
import { expect, test } from "../../index";
import {
  completeVerification,
  newActor,
  register,
  uniqueEmail,
  waitForMessage,
} from "../../support/accounts";

const password = "OldPassw0rd!";

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

async function signInInPage(page: Page, email: string) {
  await page.goto("/login");
  await page.getByTestId("username-input").fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("submit-login-button").click();
  await expect(page.getByTestId("dashboard-wrapper")).toBeVisible({
    timeout: 30000,
  });
}

// The form only fills in once the account has loaded
async function openAccountSettings(page: Page) {
  const accountLoaded = page.waitForResponse(
    (res) => /\/api\/v1\/users\/\d+$/.test(res.url()) && res.ok()
  );
  await page.goto("/settings/account");
  await accountLoaded;
}

const displayNameInput = (page: Page) =>
  page.locator('p:text-is("Display Name") + input');
const emailInput = (page: Page) => page.locator('input[type="email"]');
const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Save Changes" });

async function requestEmailChangeInPage(page: Page, newEmail: string) {
  await emailInput(page).fill(newEmail);
  await saveButton(page).click();
  // A new email asks for the password first
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(
    page.getByText(
      "Email change request sent. Please verify the new email address."
    )
  ).toBeVisible();
}

// Opens the link from the verification email sent to the new address
async function verifyFromEmail(page: Page, message: string) {
  const token = message.match(/verify-email\?token=([0-9a-f]+)/)?.[1];
  expect(token).toBeTruthy();

  await page.goto(`/auth/verify-email?token=${token}`);
  await expect(page.getByText("Email verified. Signing out...")).toBeVisible();
}

test.describe("Changing the email", { tag: "@email-change" }, () => {
  test.skip(
    !process.env.DATABASE_URL,
    "Needs DATABASE_URL to read and store account emails"
  );

  const prisma = new PrismaClient();
  test.afterAll(() => prisma.$disconnect());

  const account = (id: number) =>
    prisma.user.findUniqueOrThrow({ where: { id } });

  test("An account changes its email once the new address is verified", async ({
    page,
  }) => {
    const email = uniqueEmail("change");
    await verifiedAccount(email);
    const { id } = await prisma.user.findUniqueOrThrow({ where: { email } });

    await signInInPage(page, email);
    await openAccountSettings(page);
    const newEmail = uniqueEmail("changed");
    await requestEmailChangeInPage(page, newEmail);

    // Nothing changes until the new address is verified
    expect(await account(id)).toMatchObject({
      email,
      unverifiedNewEmail: newEmail,
    });

    await verifyFromEmail(page, await waitForMessage(newEmail, 0));
    expect(await account(id)).toMatchObject({
      email: newEmail,
      unverifiedNewEmail: null,
    });
  });

  test("An account whose email is stored with capitals saves its settings and changes its email", async ({
    page,
  }) => {
    const email = uniqueEmail("caps");
    await verifiedAccount(email);
    await signInInPage(page, email);

    // Older accounts can have their email stored with capitals
    const capitalized = email
      .replace(/^caps/, "Caps")
      .replace(/@lab\.test$/, "@Lab.Test");
    const { id } = await prisma.user.update({
      where: { email },
      data: { email: capitalized },
    });

    await openAccountSettings(page);
    await expect(emailInput(page)).toHaveValue(capitalized);

    // Saving other settings doesn't count as an email change
    await displayNameInput(page).fill("Renamed User");
    await saveButton(page).click();
    await expect(page.getByText("Settings Applied!")).toBeVisible();
    expect(await account(id)).toMatchObject({
      name: "Renamed User",
      email: capitalized,
      unverifiedNewEmail: null,
    });

    const newEmail = uniqueEmail("caps-changed");
    await requestEmailChangeInPage(page, newEmail);
    await verifyFromEmail(page, await waitForMessage(newEmail, 0));
    expect(await account(id)).toMatchObject({
      email: newEmail,
      unverifiedNewEmail: null,
    });
  });
});
