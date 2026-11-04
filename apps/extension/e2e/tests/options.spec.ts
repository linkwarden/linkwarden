import { expect, storedConfig, test } from "../index";
import { auth, createUser } from "../data/api";

test.describe("Options page", () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(
      `chrome-extension://${extensionId}/src/pages/Options/options.html`
    );
  });

  test("Signs in with a username and password", async ({
    page,
    request,
    background,
    baseURL,
  }) => {
    const user = await createUser(request);

    await page.getByLabel("URL").fill(`${baseURL}/`);
    await page.getByLabel("Username or Email").fill(user.username);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Save" }).click();

    const instance = new URL(baseURL!).host;
    await expect(page.getByText(`Signed in to ${instance}`)).toBeVisible();

    // The trailing slash is dropped, and the session it created works.
    const config = await storedConfig(background);
    expect(config).toMatchObject({ baseUrl: baseURL });
    const collections = await request.get("/api/v1/collections", {
      headers: auth({ ...user, token: config.apiKey }),
    });
    expect(collections.ok()).toBeTruthy();
  });

  test("Signs in with an API key", async ({
    page,
    request,
    background,
    baseURL,
  }) => {
    const user = await createUser(request);

    await page.getByLabel("URL").fill(baseURL!);
    await page.getByRole("button", { name: "Method" }).click();
    await page.getByRole("option", { name: "API Key" }).click();
    await page.getByLabel("API Key").fill(user.token);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Signed in to")).toBeVisible();
    expect(await storedConfig(background)).toMatchObject({
      baseUrl: baseURL,
      apiKey: user.token,
    });
  });

  test("Stays signed out after a wrong password", async ({
    page,
    request,
    background,
    baseURL,
  }) => {
    const user = await createUser(request);

    await page.getByLabel("URL").fill(baseURL!);
    await page.getByLabel("Username or Email").fill(user.username);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Error", { exact: true })).toBeVisible();
    await expect(page.getByText("Signed in to")).toBeHidden();
    expect(await storedConfig(background)).toBeNull();
  });

  test("Says to wait after too many wrong passwords", async ({
    page,
    request,
    background,
    baseURL,
  }) => {
    const user = await createUser(request);

    for (let i = 0; i < 15; i++) {
      const response = await request.post("/api/v1/session", {
        data: { username: user.username, password: `wrong-password-${i}` },
      });
      expect(response.status()).toBe(400);
    }

    await page.getByLabel("URL").fill(baseURL!);
    await page.getByLabel("Username or Email").fill(user.username);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText(
        /^Too many incorrect passwords\. Please try again in \d+ seconds?\.$/
      )
    ).toBeVisible();
    await expect(page.getByText("Signed in to")).toBeHidden();
    expect(await storedConfig(background)).toBeNull();
  });

  test("Signing out forgets the instance", async ({
    page,
    request,
    background,
    signIn,
  }) => {
    const user = await createUser(request);
    await signIn(user);
    await page.reload();

    await page.getByRole("button", { name: "Sign Out" }).click();

    await expect(page.getByLabel("URL")).toBeVisible();
    expect(await storedConfig(background)).toMatchObject({
      baseUrl: "",
      apiKey: "",
    });
  });

  test("Signing out revokes the session a username and password sign-in created", async ({
    page,
    request,
    background,
    baseURL,
  }) => {
    const user = await createUser(request);

    await page.getByLabel("URL").fill(baseURL!);
    await page.getByLabel("Username or Email").fill(user.username);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Signed in to")).toBeVisible();
    const session = { ...user, token: (await storedConfig(background)).apiKey };
    expect(
      (await request.get("/api/v1/users/me", { headers: auth(session) })).ok()
    ).toBeTruthy();

    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByLabel("URL")).toBeVisible();

    await expect
      .poll(async () =>
        (
          await request.get("/api/v1/users/me", { headers: auth(session) })
        ).status()
      )
      .toBe(401);
    // The user's other sessions stay signed in
    expect(
      (await request.get("/api/v1/users/me", { headers: auth(user) })).status()
    ).toBe(200);
  });

  test("Signing out leaves an API key working", async ({
    page,
    request,
    baseURL,
  }) => {
    const user = await createUser(request);
    const created = await request.post("/api/v1/tokens", {
      headers: auth(user),
      data: { name: "extension", expires: 4 },
    });
    expect(created.ok()).toBeTruthy();
    const apiKey = {
      ...user,
      token: (await created.json()).response.secretKey,
    };

    await page.getByLabel("URL").fill(baseURL!);
    await page.getByRole("button", { name: "Method" }).click();
    await page.getByRole("option", { name: "API Key" }).click();
    await page.getByLabel("API Key").fill(apiKey.token);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Signed in to")).toBeVisible();

    // Older versions of the extension don't tell the server at all
    const signOutRequest = page
      .waitForResponse(
        (res) =>
          res.url().endsWith("/api/v1/session") &&
          res.request().method() === "DELETE",
        { timeout: 5000 }
      )
      .catch(() => null);
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByLabel("URL")).toBeVisible();
    await signOutRequest;

    expect(
      (
        await request.get("/api/v1/users/me", { headers: auth(apiKey) })
      ).status()
    ).toBe(200);
  });
});
