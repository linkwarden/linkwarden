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
});
