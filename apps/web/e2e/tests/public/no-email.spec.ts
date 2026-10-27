import { expect, test } from "../../index";

const password = "password";

test.describe("Instances without email", { tag: "@no-email" }, () => {
  test.beforeEach(async ({ request }) => {
    const probe = await request.post(
      "/api/v1/auth/request-verification-email",
      { data: { email: "probe@example.com" } }
    );
    test.skip(
      (await probe.json()).response !== "Email is not configured.",
      "Needs an instance without EMAIL_SERVER"
    );
  });

  test("New accounts log in on web and mobile without any verification", async ({
    request,
    loginPage,
    dashboardPage,
  }) => {
    const username = `noemail-${Date.now()}`;
    const created = await request.post("/api/v1/users", {
      data: { username, password, name: "No Email" },
    });
    expect(created.status()).toBe(201);

    await loginPage.goto();
    await loginPage.usernameInput.fill(username);
    await loginPage.passwordInput.fill(password);
    await loginPage.submitLoginButton.click();
    await expect(dashboardPage.container).toBeVisible();

    // An app that sends a verification code anyway still gets a session
    const session = await request.post("/api/v1/session", {
      data: { username, password, code: "123456" },
    });
    expect(session.status()).toBe(200);
  });
});
