import { PrismaClient } from "@prisma/client";
import { expect, test } from "../../index";
import {
  credentialsLogin,
  currentUser,
  newActor,
  register,
  uniqueEmail,
  verificationFrom,
  waitForMessage,
} from "../../support/accounts";

const password = "E2ePassw0rd!";

// Digits from keyboards that don't type ASCII numbers
const arabicIndic = (digits: string) =>
  digits.replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
const persian = (digits: string) =>
  digits.replace(/\d/g, (d) => String.fromCharCode(0x06f0 + Number(d)));

test.describe("Email verification edge cases", { tag: "@email-code" }, () => {
  test("An account logged into by username is verified with its code on web and mobile", async () => {
    const web = await newActor();
    const webEmail = uniqueEmail("username-web");
    const webUsername = `web${Date.now()}`;

    await register(web, { email: webEmail, password, username: webUsername });
    expect(await credentialsLogin(web, webUsername, password)).toBe(
      "Email not verified."
    );
    const { code } = verificationFrom(await waitForMessage(webEmail, 0));
    expect(await credentialsLogin(web, webUsername, password, code)).toBeNull();
    expect((await currentUser(web)).body.response.email).toBe(webEmail);

    const mobile = await newActor();
    const mobileEmail = uniqueEmail("username-mobile");
    const mobileUsername = `mobile${Date.now()}`;

    await register(mobile, {
      email: mobileEmail,
      password,
      username: mobileUsername,
    });
    const unverified = await mobile.post("/api/v1/session", {
      data: { username: mobileUsername, password },
    });
    expect(unverified.status()).toBe(401);
    // The app shows this address on the code screen
    expect((await unverified.json()).email).toBe(mobileEmail);

    const { code: mobileCode } = verificationFrom(
      await waitForMessage(mobileEmail, 0)
    );
    const session = await mobile.post("/api/v1/session", {
      data: { username: mobileUsername, password, code: mobileCode },
    });
    expect(session.status()).toBe(200);
  });

  test("An email typed with capital letters is verified with its code", async () => {
    const actor = await newActor();
    const email = uniqueEmail("capitals");
    const typed = email.toUpperCase();

    await register(actor, { email, password });
    expect(await credentialsLogin(actor, typed, password)).toBe(
      "Email not verified."
    );
    const { code } = verificationFrom(await waitForMessage(email, 0));

    expect(await credentialsLogin(actor, typed, password, code)).toBeNull();
    expect((await currentUser(actor)).body.response.email).toBe(email);
  });

  test("Wrong codes sent in parallel can't get past the attempt limit", async () => {
    const actor = await newActor();
    const email = uniqueEmail("parallel");

    await register(actor, { email, password });
    await credentialsLogin(actor, email, password);
    const { code } = verificationFrom(await waitForMessage(email, 0));
    const right = Number(code);

    const responses = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        actor.post("/api/v1/session", {
          data: {
            username: email,
            password,
            code: String((right + i + 1) % 1000000).padStart(6, "0"),
          },
        })
      )
    );
    const errors = await Promise.all(
      responses.map(async (response) => (await response.json()).response)
    );

    expect(errors.filter((e) => e === "Invalid or expired code.")).toHaveLength(
      10
    );
    expect(
      errors.filter(
        (e) => e === "Too many incorrect codes. Please try again later."
      )
    ).toHaveLength(15);

    const last = await actor.post("/api/v1/session", {
      data: { username: email, password, code },
    });
    expect((await last.json()).response).toBe(
      "Too many incorrect codes. Please try again later."
    );
  });

  test("The code email says where to enter the code", async () => {
    const actor = await newActor();
    const email = uniqueEmail("instructions");

    await register(actor, { email, password });
    await credentialsLogin(actor, email, password);
    const message = await waitForMessage(email, 0);

    // People on an app from before codes need the web or an updated app
    expect(message).toContain(
      "Log in to Linkwarden on the web or in the mobile app and enter this code."
    );
    expect(message).toContain(
      "If the app doesn't ask for a code, update it or use the web."
    );
  });

  // Not handled on purpose: the code is emailed in ASCII digits, and pasting or
  // autofill works. Typing it on these keyboards leaves the field empty.
  test.fixme(
    "The code field takes digits typed on an Arabic or Persian keyboard",
    async ({ page, loginPage, dashboardPage }) => {
      const email = uniqueEmail("eastern-digits");
      await register(await newActor(), { email, password });

      await loginPage.goto();
      await loginPage.usernameInput.fill(email);
      await loginPage.passwordInput.fill(password);
      await loginPage.submitLoginButton.click();
      const { code } = verificationFrom(await waitForMessage(email, 0));

      const input = page.getByTestId("verification-code-input");

      await input.pressSequentially(persian(code as string));
      await expect(input).toHaveValue(code as string);

      await input.clear();
      await input.pressSequentially(arabicIndic(code as string));
      await expect(input).toHaveValue(code as string);

      await page.getByTestId("verify-email-button").click();
      await expect(dashboardPage.container).toBeVisible();
    }
  );

  test.describe("in a language without the code screen's translations", () => {
    test.use({ locale: "de-DE" });

    test("The code screen falls back to English instead of showing raw keys", async ({
      page,
      loginPage,
    }) => {
      const email = uniqueEmail("german");
      await register(await newActor(), { email, password });

      await loginPage.goto();
      await loginPage.usernameInput.fill(email);
      await loginPage.passwordInput.fill(password);
      await loginPage.submitLoginButton.click();
      await waitForMessage(email, 0);

      await expect(
        page.getByText("Enter the 6-digit code we sent to your email address.")
      ).toBeVisible();
      await expect(page.getByTestId("verification-code-input")).toHaveAttribute(
        "placeholder",
        "Verification code"
      );
      await expect(page.getByText(/verification_code|resend_code/)).toHaveCount(
        0
      );
    });
  });

  test.describe("with stored codes", () => {
    test.skip(!process.env.DATABASE_URL, "Needs DATABASE_URL to expire codes");

    const prisma = new PrismaClient();
    test.afterAll(() => prisma.$disconnect());

    test("An expired code is refused, and a new one can be sent right away", async () => {
      const actor = await newActor();
      const email = uniqueEmail("expired");

      await register(actor, { email, password });
      await credentialsLogin(actor, email, password);
      const { code } = verificationFrom(await waitForMessage(email, 0));

      await prisma.emailVerificationCode.update({
        where: { identifier: email },
        data: { expires: new Date(Date.now() - 1000) },
      });
      expect(await credentialsLogin(actor, email, password, code)).toBe(
        "Invalid or expired code."
      );

      const resent = await actor.post(
        "/api/v1/auth/request-verification-email",
        { data: { email } }
      );
      expect(resent.status()).toBe(200);
      const { code: fresh } = verificationFrom(await waitForMessage(email, 1));

      expect(await credentialsLogin(actor, email, password, fresh)).toBeNull();
    });

    test("The attempt limit resets after an hour", async () => {
      const actor = await newActor();
      const email = uniqueEmail("hour-window");

      await register(actor, { email, password });
      await credentialsLogin(actor, email, password);
      const { code } = verificationFrom(await waitForMessage(email, 0));
      const wrong = code === "000000" ? "000001" : "000000";
      for (let i = 0; i < 10; i++)
        await credentialsLogin(actor, email, password, wrong);

      // Dates the last send two minutes back, past the resend cooldown
      await prisma.emailVerificationCode.update({
        where: { identifier: email },
        data: { expires: new Date(Date.now() + 18 * 60 * 1000) },
      });
      const locked = await actor.post(
        "/api/v1/auth/request-verification-email",
        { data: { email } }
      );
      expect((await locked.json()).response).toBe(
        "Too many incorrect codes. Please try again later."
      );

      // Dates the first code back past the hour
      await prisma.emailVerificationCode.update({
        where: { identifier: email },
        data: { createdAt: new Date(Date.now() - 61 * 60 * 1000) },
      });

      const resent = await actor.post(
        "/api/v1/auth/request-verification-email",
        { data: { email } }
      );
      expect(resent.status()).toBe(200);
      const { code: fresh } = verificationFrom(await waitForMessage(email, 1));

      expect(await credentialsLogin(actor, email, password, fresh)).toBeNull();
    });
  });
});
