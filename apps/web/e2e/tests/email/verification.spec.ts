import { expect, test } from "../../index";
import {
  completeVerification,
  completeVerificationInPage,
  credentialsLogin,
  csrfToken,
  currentUser,
  messagesTo,
  newActor,
  register,
  uniqueEmail,
  verificationFrom,
  waitForMessage,
} from "../../support/accounts";

const password = "E2ePassw0rd!";

test.describe("Email verification", { tag: "@email-verification" }, () => {
  test("Signing up on the web verifies the email and logs in", async ({
    page,
    registrationPage,
    dashboardPage,
    loginPage,
  }) => {
    const email = uniqueEmail("signup");

    await page.goto("/register");
    await registrationPage.displayNameInput.fill("Sign Up");
    await page.getByTestId("email-input").fill(email);
    await registrationPage.passwordInput.fill(password);
    await registrationPage.registerButton.click();

    await completeVerificationInPage(page, await waitForMessage(email, 0));
    await expect(dashboardPage.container).toBeVisible();

    await page.context().clearCookies();
    await loginPage.goto();
    await loginPage.usernameInput.fill(email);
    await loginPage.passwordInput.fill(password);
    await loginPage.submitLoginButton.click();
    await expect(dashboardPage.container).toBeVisible();
  });

  test("Logging in with an unverified email asks for verification first", async ({
    page,
    loginPage,
    dashboardPage,
  }) => {
    const email = uniqueEmail("login");
    expect((await register(await newActor(), { email, password })).ok()).toBe(
      true
    );

    await loginPage.goto();
    await loginPage.usernameInput.fill(email);
    await loginPage.passwordInput.fill(password);
    await loginPage.submitLoginButton.click();

    await completeVerificationInPage(page, await waitForMessage(email, 0));
    await expect(dashboardPage.container).toBeVisible();
  });

  test("Signing up through the mobile API ends with a working session token", async () => {
    const actor = await newActor();
    const email = uniqueEmail("mobile");

    expect((await register(actor, { email, password })).ok()).toBe(true);
    const sent = await actor.post("/api/v1/auth/request-verification-email", {
      data: { email },
    });
    expect(sent.ok()).toBe(true);

    const { code, link } = verificationFrom(await waitForMessage(email, 0));
    let token: string;

    if (code) {
      const session = await actor.post("/api/v1/session", {
        data: { username: email, password, code, sessionName: "e2e" },
      });
      expect(session.status()).toBe(200);
      token = (await session.json()).response.token;
    } else {
      // Older instances: the app sends the link's token instead
      const params = new URL(link as string).searchParams;
      const session = await actor.post("/api/v1/auth/verify-email-token", {
        data: { token: params.get("token"), email, sessionName: "e2e" },
      });
      expect(session.status()).toBe(200);
      token = (await session.json()).response.token;
    }

    const me = await actor.get("/api/v1/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect((await me.json()).response.email).toBe(email);
  });

  test("A verified account logs in with its password on web and mobile", async () => {
    const actor = await newActor();
    const email = uniqueEmail("verified");

    await register(actor, { email, password });
    await actor.post("/api/v1/auth/request-verification-email", {
      data: { email },
    });
    expect(
      await completeVerification(
        actor,
        email,
        password,
        await waitForMessage(email, 0)
      )
    ).toBeNull();

    const web = await newActor();
    expect(await credentialsLogin(web, email, password)).toBeNull();
    expect((await currentUser(web)).status).toBe(200);

    const mobile = await newActor();
    const session = await mobile.post("/api/v1/session", {
      data: { username: email, password },
    });
    expect(session.status()).toBe(200);
    expect(messagesTo(email)).toHaveLength(1);
  });
});

test.describe("Email verification codes", { tag: "@email-code" }, () => {
  test("A wrong code is rejected and the account stays unverified", async () => {
    const actor = await newActor();
    const email = uniqueEmail("wrong-code");

    await register(actor, { email, password });
    expect(await credentialsLogin(actor, email, password)).toBe(
      "Email not verified."
    );
    const { code } = verificationFrom(await waitForMessage(email, 0));
    expect(code).toMatch(/^\d{6}$/);

    const wrong = code === "000000" ? "000001" : "000000";
    expect(await credentialsLogin(actor, email, password, wrong)).toBe(
      "Invalid or expired code."
    );
    expect(await credentialsLogin(actor, email, password)).toBe(
      "Email not verified."
    );
  });

  test("A code only works with the account's password", async () => {
    const actor = await newActor();
    const email = uniqueEmail("code-password");

    await register(actor, { email, password });
    await credentialsLogin(actor, email, password);
    const { code } = verificationFrom(await waitForMessage(email, 0));

    expect(await credentialsLogin(actor, email, "SomeoneElsesPw1", code)).toBe(
      "Invalid credentials."
    );

    const session = await actor.post("/api/v1/session", {
      data: { username: email, password: "SomeoneElsesPw1", code },
    });
    expect(session.status()).toBe(400);
    expect((await currentUser(actor)).status).toBe(401);
  });

  test("A code can't verify a different account", async () => {
    const actor = await newActor();
    const first = uniqueEmail("code-first");
    const second = uniqueEmail("code-second");

    await register(actor, { email: first, password });
    await register(actor, { email: second, password });
    await credentialsLogin(actor, first, password);
    const { code } = verificationFrom(await waitForMessage(first, 0));

    expect(await credentialsLogin(actor, second, password, code)).toBe(
      "Invalid or expired code."
    );
  });

  test("Malformed codes get the normal error, not an internal one", async () => {
    const actor = await newActor();
    const email = uniqueEmail("malformed");

    await register(actor, { email, password });
    await credentialsLogin(actor, email, password);
    await waitForMessage(email, 0);

    for (const code of [["123456"], { code: "123456" }, 123456, true]) {
      // NextAuth also accepts JSON, so the code can arrive as any type
      const response = await actor.post("/api/v1/auth/callback/credentials", {
        data: {
          username: email,
          password,
          code,
          csrfToken: await csrfToken(actor),
          callbackUrl: "/",
        },
        maxRedirects: 0,
      });
      const error = new URL(
        response.headers()["location"] as string
      ).searchParams.get("error");
      expect(error).toBe("Invalid or expired code.");
    }

    expect((await currentUser(actor)).status).toBe(401);
  });

  test("Codes lock after 10 wrong attempts, even the right one", async () => {
    const actor = await newActor();
    const email = uniqueEmail("lockout");

    await register(actor, { email, password });
    await credentialsLogin(actor, email, password);
    const { code } = verificationFrom(await waitForMessage(email, 0));
    const right = Number(code);

    for (let i = 1; i <= 10; i++)
      expect(
        await credentialsLogin(
          actor,
          email,
          password,
          String((right + i) % 1000000).padStart(6, "0")
        )
      ).toBe("Invalid or expired code.");

    expect(await credentialsLogin(actor, email, password, code)).toBe(
      "Too many incorrect codes. Please try again later."
    );
  });

  test("Resending a code within a minute is refused", async () => {
    const actor = await newActor();
    const email = uniqueEmail("cooldown");

    await register(actor, { email, password });
    const first = await actor.post("/api/v1/auth/request-verification-email", {
      data: { email },
    });
    expect(first.status()).toBe(200);

    const second = await actor.post("/api/v1/auth/request-verification-email", {
      data: { email },
    });
    expect(second.status()).toBe(429);
    expect(messagesTo(email)).toHaveLength(1);
  });

  test("The web code screen shows errors and the resend cooldown", async ({
    page,
    loginPage,
    dashboardPage,
  }) => {
    const email = uniqueEmail("code-ui");
    await register(await newActor(), { email, password });

    await loginPage.goto();
    await loginPage.usernameInput.fill(email);
    await loginPage.passwordInput.fill(password);
    await loginPage.submitLoginButton.click();
    const { code } = verificationFrom(await waitForMessage(email, 0));

    await page
      .getByTestId("verification-code-input")
      .fill(code === "000000" ? "000001" : "000000");
    await page.getByTestId("verify-email-button").click();
    await expect(page.getByText("Invalid or expired code.")).toBeVisible();

    await page.getByRole("button", { name: "Resend Code" }).click();
    await expect(
      page.getByText("Please wait a minute before requesting a new code.")
    ).toBeVisible();

    await page.getByTestId("verification-code-input").fill(code as string);
    await page.getByTestId("verify-email-button").click();
    await expect(dashboardPage.container).toBeVisible();
  });

  test("Resending a code works when logging in with a username", async ({
    page,
    loginPage,
  }) => {
    const email = uniqueEmail("by-username");
    const username = `user${Date.now()}`;
    await register(await newActor(), { email, password, username });

    await loginPage.goto();
    await loginPage.usernameInput.fill(username);
    await loginPage.passwordInput.fill(password);
    await loginPage.submitLoginButton.click();
    await waitForMessage(email, 0);

    // Wait out the resend cooldown so only the username handling is tested
    await page.waitForTimeout(61000);
    await page.getByRole("button", { name: "Resend Code" }).click();
    await expect(page.getByText("Verification code sent.")).toBeVisible();
    await waitForMessage(email, 1);
  });
});
