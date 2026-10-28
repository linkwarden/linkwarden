import { badgeOf, expect, tabIdOf, test } from "../index";
import {
  createCollection,
  createLink,
  createUser,
  getLinks,
} from "../data/api";

test.describe("Popup", () => {
  test("Saves the current tab to Unorganized", async ({
    request,
    background,
    signIn,
    openWebPage,
    openPopup,
  }) => {
    const user = await createUser(request);
    await signIn(user);
    const target = await openWebPage("An article worth keeping");

    const popup = await openPopup(target);
    await expect(popup.getByRole("button", { name: "Collection" })).toHaveText(
      "Unorganized"
    );
    await popup.getByRole("button", { name: "Save" }).click();
    await expect(
      popup.getByText("Link saved successfully!", { exact: true })
    ).toBeVisible();

    const links = await getLinks(request, user);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      url: target.url(),
      name: "An article worth keeping",
      collection: { name: "Unorganized" },
    });
    expect(await badgeOf(background, await tabIdOf(background, target))).toBe(
      "✓"
    );
  });

  test("Saves into the chosen collection with a custom name", async ({
    request,
    signIn,
    openWebPage,
    openPopup,
  }) => {
    const user = await createUser(request);
    const reading = await createCollection(request, user, "Reading");
    await signIn(user);
    const target = await openWebPage("Original title");

    const popup = await openPopup(target);
    await popup.getByRole("button", { name: "Collection" }).click();
    await popup.getByRole("option", { name: /Reading/ }).click();
    await popup.getByRole("button", { name: "More Options" }).click();
    await popup.getByLabel("Name", { exact: true }).fill("Custom name");
    await popup.getByLabel("Description").fill("Read this later");
    await popup.getByRole("button", { name: "Save" }).click();
    await expect(
      popup.getByText("Link saved successfully!", { exact: true })
    ).toBeVisible();

    const [link] = await getLinks(request, user);
    expect(link).toMatchObject({
      url: target.url(),
      name: "Custom name",
      description: "Read this later",
      collection: { id: reading.id, name: "Reading" },
    });
  });

  test("Points out a link that was already saved", async ({
    context,
    request,
    background,
    signIn,
    openWebPage,
    openPopup,
  }) => {
    const user = await createUser(request);
    await signIn(user);
    const target = await openWebPage("Seen before");
    await createLink(request, user, target.url());

    // The popup asks for `url:<link>`, which only Meilisearch understands; the
    // database fallback searches for that text literally and finds nothing.
    // Answer from the real links list so this runs against either setup.
    const searches: string[] = [];
    await context.route("**/api/v1/search?**", async (route) => {
      const query = new URL(route.request().url()).searchParams;
      searches.push(query.get("searchQueryString") ?? "");
      const links = (await getLinks(request, user)).filter(
        ({ url }) => `url:${url}` === query.get("searchQueryString")
      );
      await route.fulfill({ json: { data: { links, nextCursor: null } } });
    });

    const popup = await openPopup(target);

    await expect(
      popup.getByText("Note: You've already saved this link")
    ).toBeVisible();
    expect(searches).toEqual([`url:${target.url()}`]);
    expect(await badgeOf(background, await tabIdOf(background, target))).toBe(
      "✓"
    );
  });

  test("Asks to set up first, then saves after signing in", async ({
    request,
    baseURL,
    openWebPage,
    openPopup,
  }) => {
    const user = await createUser(request);
    const target = await openWebPage("Saved after setup");

    const popup = await openPopup(target);
    await expect(
      popup.getByRole("heading", { name: "Initial Setup" })
    ).toBeVisible();
    await popup.getByRole("button", { name: "Configure" }).click();

    await popup.getByLabel("URL").fill(baseURL!);
    await popup.getByRole("button", { name: "Method" }).click();
    await popup.getByRole("option", { name: "API Key" }).click();
    await popup.getByLabel("API Key").fill(user.token);
    await popup.getByRole("button", { name: "Save" }).click();

    await expect(popup.getByLabel("API Key")).toBeHidden();
    await expect(
      popup.getByRole("heading", { name: "Initial Setup" })
    ).toBeHidden();
    await popup.getByRole("button", { name: "Save" }).click();
    await expect(
      popup.getByText("Link saved successfully!", { exact: true })
    ).toBeVisible();

    const [link] = await getLinks(request, user);
    expect(link).toMatchObject({
      url: target.url(),
      name: "Saved after setup",
    });
  });

  test("Shows an error when the instance rejects the API key", async ({
    request,
    signIn,
    openWebPage,
    openPopup,
  }) => {
    const user = await createUser(request);
    await signIn({ token: "not-a-real-token" });
    const target = await openWebPage("Never saved");

    const popup = await openPopup(target);
    await popup.getByRole("button", { name: "Save" }).click();
    await expect(popup.getByText("Error", { exact: true })).toBeVisible();

    expect(await getLinks(request, user)).toHaveLength(0);
  });
});
