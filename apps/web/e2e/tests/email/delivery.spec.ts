import { PrismaClient } from "@prisma/client";
import { expect, test } from "../../index";
import {
  messagesTo,
  newActor,
  register,
  uniqueEmail,
} from "../../support/accounts";

const password = "E2ePassw0rd!";

// support/mail-sink.mjs refuses every address that starts with "bounce", which
// is what a down or misconfigured mail server does to every send
test.describe("Undeliverable codes", { tag: "@email-delivery" }, () => {
  test("Logging in still asks for the code when it couldn't be emailed", async ({
    page,
    loginPage,
  }) => {
    const email = uniqueEmail("bounce-login");
    expect((await register(await newActor(), { email, password })).ok()).toBe(
      true
    );

    await loginPage.goto();
    await loginPage.usernameInput.fill(email);
    await loginPage.passwordInput.fill(password);
    await loginPage.submitLoginButton.click();

    await expect(page.getByTestId("verification-code-input")).toBeVisible();
    expect(messagesTo(email)).toHaveLength(0);
  });

  test("A refused send gets a JSON error the web and mobile apps can show", async () => {
    const actor = await newActor();
    const email = uniqueEmail("bounce-api");
    await register(actor, { email, password });

    const response = await actor.post(
      "/api/v1/auth/request-verification-email",
      { data: { email } }
    );

    expect(response.ok()).toBe(false);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(typeof (await response.json()).response).toBe("string");
  });

  test("A failed send doesn't start the resend cooldown", async () => {
    const actor = await newActor();
    const email = uniqueEmail("bounce-cooldown");
    await register(actor, { email, password });

    for (let i = 0; i < 2; i++) {
      const response = await actor.post(
        "/api/v1/auth/request-verification-email",
        { data: { email } }
      );
      expect((await response.json()).response).toBe(
        "The verification email couldn't be sent. Please try again later."
      );
    }
  });

  test.describe("past the resend cooldown", () => {
    test.skip(
      !process.env.DATABASE_URL,
      "Needs DATABASE_URL to skip the resend cooldown"
    );

    const prisma = new PrismaClient();
    test.afterAll(() => prisma.$disconnect());

    test("Resend Code shows the failure and keeps the form usable", async ({
      page,
      loginPage,
    }) => {
      const email = uniqueEmail("bounce-resend");
      await register(await newActor(), { email, password });

      await loginPage.goto();
      await loginPage.usernameInput.fill(email);
      await loginPage.passwordInput.fill(password);
      await loginPage.submitLoginButton.click();
      await expect(page.getByTestId("verification-code-input")).toBeVisible();

      // Dates any stored send two minutes back, so the cooldown has passed
      await prisma.emailVerificationCode.updateMany({
        where: { identifier: email },
        data: { expires: new Date(Date.now() + 18 * 60 * 1000) },
      });

      await page.getByRole("button", { name: "Resend Code" }).click();

      const toast = await loginPage.getLatestToast();
      await expect(toast.locator).toHaveAttribute("data-type", "error");
      await expect(page.getByTestId("verify-email-button")).toBeEnabled();
      await expect(
        page.getByRole("button", { name: "Resend Code" })
      ).toBeEnabled();
    });
  });
});
