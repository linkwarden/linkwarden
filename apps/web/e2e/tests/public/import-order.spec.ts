import { APIRequestContext, Page } from "@playwright/test";
import JSZip from "jszip";
import { expect, test } from "../../index";
import { auth, createUser, TestUser } from "@/e2e/data/api";

async function login(page: Page, owner: TestUser) {
  await page.goto("/login");
  await page.getByTestId("username-input").fill(owner.username);
  await page.getByTestId("password-input").fill("password");
  await page.getByTestId("submit-login-button").click();
  await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();
}

// Picks a file from the Import Links menu on the account settings page, the way
// a user would, and waits for the page to reload after the import
async function importFile(
  page: Page,
  inputId: string,
  file: { name: string; mimeType: string; content: string | Buffer }
) {
  await page.goto("/settings/account");
  await page.getByRole("button", { name: /Import Links/ }).click();
  await page.locator(`#${inputId}`).setInputFiles({
    name: file.name,
    mimeType: file.mimeType,
    buffer:
      typeof file.content === "string"
        ? Buffer.from(file.content)
        : file.content,
  });
  await expect(
    page.getByText("Imported the Bookmarks! Reloading the page...")
  ).toBeVisible();
  await page.waitForEvent("load");
}

async function collectionIdByName(
  request: APIRequestContext,
  owner: TestUser,
  name: string
) {
  const response = await request.get("/api/v1/collections", {
    headers: auth(owner),
  });
  const { response: collections } = await response.json();

  return (collections as { id: number; name: string }[]).find(
    (collection) => collection.name === name
  )!.id;
}

// The names of the links on the page, top to bottom, out of `names`
async function shownNames(page: Page, names: string[]) {
  const pattern = new RegExp(`^(${names.join("|")})$`);
  await expect(page.getByText(pattern).first()).toBeVisible();
  await expect(page.getByText(pattern)).toHaveCount(names.length);

  return page.getByText(pattern).allInnerTexts();
}

test.describe("Import order", () => {
  test("A bookmarks file listed newest first shows its links newest first", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "importer");
    const folder = `e2e-import-${Date.now().toString(36)}`;

    // Like a Pinboard or Raindrop export: newest first
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
<DT><H3>${folder}</H3>
<DL><p>
<DT><A HREF="http://localhost/e2e-2024" ADD_DATE="1709287200">Bookmark 2024</A>
<DT><A HREF="http://localhost/e2e-2023" ADD_DATE="1677664800">Bookmark 2023</A>
<DT><A HREF="http://localhost/e2e-2022" ADD_DATE="1646128800">Bookmark 2022</A>
<DT><A HREF="http://localhost/e2e-2021" ADD_DATE="1614592800">Bookmark 2021</A>
</DL><p>
</DL><p>`;

    await login(page, owner);
    await importFile(page, "import-html-file", {
      name: "bookmarks.html",
      mimeType: "text/html",
      content: html,
    });

    const collectionId = await collectionIdByName(request, owner, folder);
    await page.goto(`/collections/${collectionId}`);

    expect(
      await shownNames(page, [
        "Bookmark 2021",
        "Bookmark 2022",
        "Bookmark 2023",
        "Bookmark 2024",
      ])
    ).toEqual([
      "Bookmark 2024",
      "Bookmark 2023",
      "Bookmark 2022",
      "Bookmark 2021",
    ]);
  });

  test("A bookmarks file with dates in milliseconds or not numbers imports", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "dates");
    const folder = `e2e-dates-${Date.now().toString(36)}`;

    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
<DT><H3>${folder}</H3>
<DL><p>
<DT><A HREF="http://localhost/e2e-milliseconds" ADD_DATE="1677664800000">Milliseconds 2023</A>
<DT><A HREF="http://localhost/e2e-not-a-number" ADD_DATE="yesterday">Not a number</A>
<DT><A HREF="http://localhost/e2e-seconds" ADD_DATE="1614592800">Seconds 2021</A>
</DL><p>
</DL><p>`;

    await login(page, owner);
    await importFile(page, "import-html-file", {
      name: "bookmarks.html",
      mimeType: "text/html",
      content: html,
    });

    const collectionId = await collectionIdByName(request, owner, folder);
    await page.goto(`/collections/${collectionId}`);

    // The link without a date shows the moment it was imported
    expect(
      await shownNames(page, [
        "Milliseconds 2023",
        "Not a number",
        "Seconds 2021",
      ])
    ).toEqual(["Not a number", "Milliseconds 2023", "Seconds 2021"]);
  });

  test("A bookmarks file whose long title is cut through an emoji imports", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "emoji");
    const folder = `e2e-emoji-${Date.now().toString(36)}`;

    // Titles are cut to 254 characters, here between the two halves of the
    // emoji, which is left out
    const shortened = "Long title " + "x".repeat(242);

    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
<DT><H3>${folder}</H3>
<DL><p>
<DT><A HREF="http://localhost/e2e-emoji" ADD_DATE="1677664800">${shortened}😀 and more</A>
<DT><A HREF="http://localhost/e2e-plain" ADD_DATE="1614592800">Plain title</A>
</DL><p>
</DL><p>`;

    await login(page, owner);
    await importFile(page, "import-html-file", {
      name: "bookmarks.html",
      mimeType: "text/html",
      content: html,
    });

    const collectionId = await collectionIdByName(request, owner, folder);
    await page.goto(`/collections/${collectionId}`);

    expect(await shownNames(page, [shortened, "Plain title"])).toEqual([
      shortened,
      "Plain title",
    ]);
  });

  test("A Linkwarden backup shows its links by date across collections", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "restorer");
    const suffix = Date.now().toString(36);

    const link = (name: string, createdAt: string) => ({
      url: `http://localhost/e2e-${name.replace(/\W/g, "-")}-${suffix}`,
      name,
      description: "",
      importDate: null,
      createdAt,
      tags: [],
    });

    const backup = {
      collections: [
        {
          name: `e2e-reading-${suffix}`,
          description: "",
          color: "#0ea5e9",
          links: [
            link("Reading 2023", "2023-06-01T10:00:00.000Z"),
            link("Reading 2020", "2020-06-01T10:00:00.000Z"),
          ],
        },
        {
          name: `e2e-recipes-${suffix}`,
          description: "",
          color: "#0ea5e9",
          links: [
            link("Recipes 2022", "2022-06-01T10:00:00.000Z"),
            link("Recipes 2021", "2021-06-01T10:00:00.000Z"),
          ],
        },
      ],
      pinnedLinks: [],
    };

    await login(page, owner);
    await importFile(page, "import-linkwarden-file", {
      name: "backup.json",
      mimeType: "application/json",
      content: JSON.stringify(backup),
    });

    await page.goto("/links");

    expect(
      await shownNames(page, [
        "Reading 2020",
        "Reading 2023",
        "Recipes 2021",
        "Recipes 2022",
      ])
    ).toEqual(["Reading 2023", "Recipes 2022", "Recipes 2021", "Reading 2020"]);
  });

  test("A Wallabag export imports with its dates and shows them newest first", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "wallabag");
    const suffix = Date.now().toString(36);

    // Wallabag writes its dates with no colon in the offset
    const entry = (id: number, createdAt: string) => ({
      is_archived: 0,
      is_starred: 0,
      tags: [],
      is_public: false,
      id,
      title: `Wallabag ${createdAt.slice(0, 4)}`,
      url: `http://localhost/e2e-wallabag-${id}-${suffix}`,
      content: "<p>Saved</p>",
      created_at: createdAt,
      updated_at: createdAt,
      annotations: [],
      mimetype: "text/html",
      language: "en",
      reading_time: 1,
      domain_name: "localhost",
      preview_picture: null,
      http_status: "200",
      headers: {},
    });

    await login(page, owner);
    await importFile(page, "import-wallabag-file", {
      name: "wallabag.json",
      mimeType: "application/json",
      content: JSON.stringify([
        entry(3, "2023-05-10T08:26:39+0200"),
        entry(1, "2021-05-10T08:26:39+0200"),
        entry(2, "2022-05-10T08:26:39-0500"),
      ]),
    });

    await page.goto("/links");

    expect(
      await shownNames(page, [
        "Wallabag 2021",
        "Wallabag 2022",
        "Wallabag 2023",
      ])
    ).toEqual(["Wallabag 2023", "Wallabag 2022", "Wallabag 2021"]);
  });

  test("A Pocket export listed newest first shows its links newest first", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "pocket");
    const suffix = Date.now().toString(36);

    await login(page, owner);
    await importFile(page, "import-pocket-file", {
      name: "pocket.csv",
      mimeType: "text/csv",
      content: [
        "title,url,time_added,cursor,tags,status",
        `Pocket 2023,http://localhost/e2e-pocket-2023-${suffix},1685700000,,,unread`,
        `Pocket 2022,http://localhost/e2e-pocket-2022-${suffix},1654100000,,,archive`,
        `Pocket 2021,http://localhost/e2e-pocket-2021-${suffix},1622600000,,,unread`,
      ].join("\n"),
    });

    const collectionId = await collectionIdByName(request, owner, "Imports");
    await page.goto(`/collections/${collectionId}`);

    expect(
      await shownNames(page, ["Pocket 2021", "Pocket 2022", "Pocket 2023"])
    ).toEqual(["Pocket 2023", "Pocket 2022", "Pocket 2021"]);
  });

  test("An import that stops partway says how many links it added", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "partway");
    const suffix = Date.now().toString(36);

    await login(page, owner);
    await page.goto("/settings/account");
    await page.getByRole("button", { name: /Import Links/ }).click();
    // A time_added that isn't a number can't be stored, which stops the import
    // once the other rows are in
    await page.locator("#import-pocket-file").setInputFiles({
      name: "pocket.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        [
          "title,url,time_added,cursor,tags,status",
          `Pocket new,http://localhost/e2e-partway-new-${suffix},1685700000,,,unread`,
          `Pocket bad,http://localhost/e2e-partway-bad-${suffix},yesterday,,,unread`,
          `Pocket old,http://localhost/e2e-partway-old-${suffix},1622600000,,,unread`,
        ].join("\n")
      ),
    });

    await expect(
      page.getByText("The import stopped after adding 2 of 3 links.")
    ).toBeVisible();

    const collectionId = await collectionIdByName(request, owner, "Imports");
    await page.goto(`/collections/${collectionId}`);

    expect(await shownNames(page, ["Pocket new", "Pocket old"])).toEqual([
      "Pocket new",
      "Pocket old",
    ]);
  });

  test("An Omnivore export shows its links by date across its metadata files", async ({
    page,
    request,
  }) => {
    const owner = await createUser(request, "omnivore");
    const suffix = Date.now().toString(36);

    const item = (title: string, savedAt: string) => ({
      id: title,
      slug: title.toLowerCase().replace(/\W/g, "-"),
      title,
      description: "",
      author: null,
      url: `http://localhost/e2e-${title.replace(/\W/g, "-")}-${suffix}`,
      state: "Succeeded",
      readingProgress: 0,
      thumbnail: null,
      labels: [],
      savedAt,
      updatedAt: savedAt,
      publishedAt: null,
    });

    // Omnivore splits an export into metadata files, each newest first, and the
    // page joins them into one list before sending it
    const zip = new JSZip();
    zip.file(
      "metadata_0_to_1.json",
      JSON.stringify([
        item("Omnivore 2024", "2024-03-01T10:00:00.000Z"),
        item("Omnivore 2022", "2022-03-01T10:00:00.000Z"),
      ])
    );
    zip.file(
      "metadata_2_to_3.json",
      JSON.stringify([
        item("Omnivore 2023", "2023-03-01T10:00:00.000Z"),
        item("Omnivore 2021", "2021-03-01T10:00:00.000Z"),
      ])
    );
    zip.file("content/omnivore-2024.html", "<p>Saved</p>");

    await login(page, owner);
    await importFile(page, "import-omnivore-file", {
      name: "omnivore.zip",
      mimeType: "application/zip",
      content: await zip.generateAsync({ type: "nodebuffer" }),
    });

    await page.goto("/links");

    expect(
      await shownNames(page, [
        "Omnivore 2021",
        "Omnivore 2022",
        "Omnivore 2023",
        "Omnivore 2024",
      ])
    ).toEqual([
      "Omnivore 2024",
      "Omnivore 2023",
      "Omnivore 2022",
      "Omnivore 2021",
    ]);
  });

  test("The list the mobile app reads shows an import newest first, and importing needs an account", async ({
    request,
  }) => {
    const folder = `e2e-api-${Date.now().toString(36)}`;
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
<DT><H3>${folder}</H3>
<DL><p>
<DT><A HREF="http://localhost/e2e-api-2023" ADD_DATE="1677664800">Api 2023</A>
<DT><A HREF="http://localhost/e2e-api-2021" ADD_DATE="1614592800">Api 2021</A>
<DT><A HREF="http://localhost/e2e-api-2022" ADD_DATE="1646128800">Api 2022</A>
</DL><p>
</DL><p>`;

    const refused = await request.post("/api/v1/migration", {
      data: { format: 1, data: html },
    });
    expect(refused.status()).toBe(401);

    const owner = await createUser(request, "api");
    const imported = await request.post("/api/v1/migration", {
      headers: auth(owner),
      data: { format: 1, data: html },
    });
    expect(imported.status()).toBe(200);
    expect(await imported.json()).toEqual({ response: "Success." });

    const collectionId = await collectionIdByName(request, owner, folder);

    // The request the mobile app's collection screen makes
    const listed = await request.get(
      `/api/v1/search?cursor=0&sort=0&collectionId=${collectionId}`,
      { headers: auth(owner) }
    );
    expect(listed.ok()).toBeTruthy();
    const { data } = await listed.json();

    expect(data.links.map((link: { name: string }) => link.name)).toEqual([
      "Api 2023",
      "Api 2022",
      "Api 2021",
    ]);
  });
});
