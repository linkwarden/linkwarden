import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Backup } from "@linkwarden/types/global";

let prisma: typeof import("@linkwarden/prisma").prisma;
let removeFolder: typeof import("@linkwarden/filesystem").removeFolder;
let importFromHTMLFile: typeof import("./importFromHTMLFile").default;
let importFromLinkwarden: typeof import("./importFromLinkwarden").default;
let importFromWallabag: typeof import("./importFromWallabag").default;
let importFromOmnivore: typeof import("./importFromOmnivore").default;
let importFromPocket: typeof import("./importFromPocket").default;
let exportData: typeof import("./exportData").default;

const createdUserIds: number[] = [];

const ensureTestEnv = async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for import files."
    );
  }

  vi.stubEnv("NODE_ENV", "test");
  process.env.STRIPE_SECRET_KEY = "";
  process.env.NEXT_PUBLIC_STRIPE = "false";
  process.env.NEXT_PUBLIC_REQUIRE_CC = "false";
  process.env.STORAGE_FOLDER = process.env.STORAGE_FOLDER || "data-test";

  delete process.env.MEILI_HOST;
  delete process.env.SPACES_ENDPOINT;
  delete process.env.SPACES_REGION;
  delete process.env.SPACES_KEY;
  delete process.env.SPACES_SECRET;
};

const createTestUser = async () => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      username: `import_files_test_${suffix}`,
      email: `import_files_test_${suffix}@example.com`,
    },
  });

  createdUserIds.push(user.id);
  return user;
};

const cleanupUser = async (userId: number) => {
  const collections = await prisma.collection.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    return;
  }

  for (const { id } of collections) {
    await removeFolder({ filePath: `archives/${id}` });
  }
};

const linksById = (userId: number) =>
  prisma.link.findMany({
    where: { createdById: userId },
    orderBy: { id: "asc" },
    include: {
      tags: { orderBy: { name: "asc" } },
      collection: true,
      pinnedBy: { select: { id: true } },
    },
  });

const collectionsById = async (userId: number) =>
  (
    await prisma.collection.findMany({
      where: { ownerId: userId },
      orderBy: { id: "asc" },
      include: { parent: true },
    })
  ).map((collection) => [collection.name, collection.parent?.name ?? null]);

// The date a link shows: the one from its file, or the moment it was added
const shownTime = (link: { importDate: Date | null; createdAt: Date }) =>
  (link.importDate ?? link.createdAt).getTime();

// An ADD_DATE: seconds since 1970, here for the start of a year
const jan1 = (year: number) => Date.UTC(year, 0, 1) / 1000;

beforeAll(async () => {
  await ensureTestEnv();

  const prismaModule = await import("@linkwarden/prisma");
  prisma = prismaModule.prisma;

  const filesystemModule = await import("@linkwarden/filesystem");
  removeFolder = filesystemModule.removeFolder;

  importFromHTMLFile = (await import("./importFromHTMLFile")).default;
  importFromLinkwarden = (await import("./importFromLinkwarden")).default;
  importFromWallabag = (await import("./importFromWallabag")).default;
  importFromOmnivore = (await import("./importFromOmnivore")).default;
  importFromPocket = (await import("./importFromPocket")).default;
  exportData = (await import("./exportData")).default;

  await prisma.$connect();
});

afterEach(async () => {
  const users = createdUserIds.splice(0, createdUserIds.length);
  for (const userId of users) {
    await cleanupUser(userId);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe.sequential("import files integration", () => {
  describe("exports from other apps", () => {
    it("imports a Chrome export with its folders, oldest first", async () => {
      const user = await createTestUser();
      const [y2019, y2020, y2021, y2022, y2023, y2024] = [
        2019, 2020, 2021, 2022, 2023, 2024,
      ].map(jan1);

      // Chrome leaves the DT tags open and puts "Other bookmarks" at the root
      const result = await importFromHTMLFile(
        user.id,
        `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1600000000" LAST_MODIFIED="1700000000" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks bar</H3>
    <DL><p>
        <DT><A HREF="https://news.ycombinator.com/" ADD_DATE="${y2021}" ICON="data:image/png;base64,iVBORw0KGgo=">Hacker News</A>
        <DT><H3 ADD_DATE="1610000000" LAST_MODIFIED="1690000000">Work</H3>
        <DL><p>
            <DT><A HREF="https://jira.example.com/browse/ABC-1" ADD_DATE="${y2023}">ABC-1</A>
            <DT><A HREF="https://docs.example.com/" ADD_DATE="${y2020}">Docs</A>
        </DL><p>
        <DT><A HREF="javascript:void(0)" ADD_DATE="${y2022}">Bookmarklet</A>
    </DL><p>
    <DT><A HREF="https://example.org/other" ADD_DATE="${y2019}">Other</A>
    <DT><H3 ADD_DATE="1600000000" LAST_MODIFIED="1700000000">Mobile bookmarks</H3>
    <DL><p>
        <DT><A HREF="https://m.example.com/" ADD_DATE="${y2024}">Mobile</A>
    </DL><p>
</DL><p>
`
      );
      expect(result).toEqual({ response: "Success.", status: 200 });

      expect(await collectionsById(user.id)).toEqual([
        ["Bookmarks bar", null],
        ["Work", "Bookmarks bar"],
        ["Imports", null],
        ["Mobile bookmarks", null],
      ]);

      const links = await linksById(user.id);
      expect(
        links.map((link) => [
          link.name,
          link.url,
          link.collection.name,
          link.importDate?.toISOString(),
        ])
      ).toEqual([
        [
          "Other",
          "https://example.org/other",
          "Imports",
          "2019-01-01T00:00:00.000Z",
        ],
        [
          "Docs",
          "https://docs.example.com/",
          "Work",
          "2020-01-01T00:00:00.000Z",
        ],
        [
          "Hacker News",
          "https://news.ycombinator.com/",
          "Bookmarks bar",
          "2021-01-01T00:00:00.000Z",
        ],
        [
          "Bookmarklet",
          "javascript:void(0)",
          "Bookmarks bar",
          "2022-01-01T00:00:00.000Z",
        ],
        [
          "ABC-1",
          "https://jira.example.com/browse/ABC-1",
          "Work",
          "2023-01-01T00:00:00.000Z",
        ],
        [
          "Mobile",
          "https://m.example.com/",
          "Mobile bookmarks",
          "2024-01-01T00:00:00.000Z",
        ],
      ]);
    });

    it("imports a Firefox export with its tags and place: links, oldest first", async () => {
      const user = await createTestUser();
      const [y2020, y2021, y2022, y2023] = [2020, 2021, 2022, 2023].map(jan1);
      const y2020Later = y2020 + 152 * 86400;

      await importFromHTMLFile(
        user.id,
        `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'none'; img-src data: *; object-src 'none'"></meta>
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks Menu</H1>

<DL><p>
    <DT><H3 ADD_DATE="1600000000" LAST_MODIFIED="1600000000">Mozilla Firefox</H3>
    <DL><p>
        <DT><A HREF="https://support.mozilla.org/products/firefox" ADD_DATE="${y2020}" LAST_MODIFIED="1600000001" ICON_URI="https://support.mozilla.org/favicon.ico">Get Help</A>
    </DL><p>
    <HR>
    <DT><H3 ADD_DATE="1600000000" LAST_MODIFIED="1700000000" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks Toolbar</H3>
    <DL><p>
        <DT><A HREF="place:sort=8&amp;maxResults=10" ADD_DATE="${y2020Later}">Most Visited</A>
        <DT><A HREF="https://www.example.com/tagged" ADD_DATE="${y2023}" LAST_MODIFIED="1690000005" TAGS="reading,tech">Tagged</A>
        <DT><A HREF="https://www.example.com/keyword" ADD_DATE="${y2022}" SHORTCUTURL="ex" LAST_CHARSET="UTF-8">Keyword</A>
    </DL><p>
    <DT><A HREF="https://www.example.com/root" ADD_DATE="${y2021}" TAGS="reading">Root</A>
    <DD>Root description
</DL>
`
      );

      expect(await collectionsById(user.id)).toEqual([
        ["Mozilla Firefox", null],
        ["Bookmarks Toolbar", null],
        ["Imports", null],
      ]);

      const links = await linksById(user.id);
      expect(
        links.map((link) => [
          link.name,
          link.url,
          link.collection.name,
          link.tags.map((tag) => tag.name),
        ])
      ).toEqual([
        [
          "Get Help",
          "https://support.mozilla.org/products/firefox",
          "Mozilla Firefox",
          [],
        ],
        ["Most Visited", "place:sort=8&maxResults=10", "Bookmarks Toolbar", []],
        ["Root", "https://www.example.com/root", "Imports", ["reading"]],
        ["Keyword", "https://www.example.com/keyword", "Bookmarks Toolbar", []],
        [
          "Tagged",
          "https://www.example.com/tagged",
          "Bookmarks Toolbar",
          ["reading", "tech"],
        ],
      ]);
      expect(links.find((link) => link.name === "Root")?.description).toBe(
        "Root description"
      );
    });

    it("keeps the order of a Safari export, which has no dates", async () => {
      const user = await createTestUser();

      // Safari writes no ADD_DATE and no DL around its top folders
      await importFromHTMLFile(
        user.id,
        `<!DOCTYPE NETSCAPE-Bookmark-file-1>
	<HTML>
	<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
	<Title>Bookmarks</Title>
	<H1>Bookmarks</H1>
	<DT><H3 FOLDED>Favorites</H3>
	<DL><p>
		<DT><A HREF="https://www.wikipedia.org/">Wikipedia</A>
		<DT><A HREF="https://www.apple.com/">Apple</A>
	</DL><p>
	<DT><H3 FOLDED>Bookmarks Menu</H3>
	<DL><p>
	</DL><p>
	<DT><H3 FOLDED id="com.apple.ReadingList">Reading List</H3>
	<DL><p>
		<DT><A HREF="https://example.com/read-later">Read later</A>
		<DD>Preview text from the page
	</DL><p>
	<DT><A HREF="https://example.com/root">Root</A>
</HTML>
`
      );

      expect(await collectionsById(user.id)).toEqual([
        ["Favorites", null],
        ["Bookmarks Menu", null],
        ["Reading List", null],
        ["Imports", null],
      ]);

      const links = await linksById(user.id);
      expect(
        links.map((link) => [link.name, link.collection.name, link.importDate])
      ).toEqual([
        ["Wikipedia", "Favorites", null],
        ["Apple", "Favorites", null],
        ["Read later", "Reading List", null],
        ["Root", "Imports", null],
      ]);
      expect(links[2].description).toBe("Preview text from the page");
    });

    it("adds a Pinboard export, which lists the newest first, oldest first", async () => {
      const user = await createTestUser();

      await importFromHTMLFile(
        user.id,
        `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Pinboard Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p><DT><A HREF="https://a.example/" ADD_DATE="1700000000" PRIVATE="0" TOREAD="1" TAGS="toread,web">Newest</A>
<DD>Pinboard description
<DT><A HREF="https://b.example/" ADD_DATE="1650000000" PRIVATE="1" TOREAD="0" TAGS="">Middle</A>
<DT><A HREF="https://c.example/" ADD_DATE="1650000000" PRIVATE="0" TOREAD="0" TAGS="web">Middle twin</A>
<DT><A HREF="https://d.example/" ADD_DATE="1600000000" PRIVATE="0" TOREAD="0" TAGS="web">Oldest</A>
</DL></p>
`
      );

      const links = await linksById(user.id);
      expect(
        links.map((link) => [
          link.name,
          link.collection.name,
          link.tags.map((tag) => tag.name),
          link.description,
        ])
      ).toEqual([
        ["Oldest", "Imports", ["web"], ""],
        ["Middle", "Imports", [], ""],
        ["Middle twin", "Imports", ["web"], ""],
        ["Newest", "Imports", ["toread", "web"], "Pinboard description"],
      ]);

      // The newest is on top of the custom order too
      const customOrder = [...links].sort(
        (a, b) => b.collectionOrder - a.collectionOrder
      );
      expect(customOrder.map((link) => link.name)).toEqual([
        "Newest",
        "Middle twin",
        "Middle",
        "Oldest",
      ]);
    });

    // These used to fail the whole import with a server error
    it("reads ADD_DATEs written in milliseconds and leaves ones that aren't dates undated", async () => {
      const user = await createTestUser();

      const result = await importFromHTMLFile(
        user.id,
        `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
<DT><H3>Dates</H3>
<DL><p>
<DT><A HREF="https://example.com/seconds" ADD_DATE="1700000000">Seconds</A>
<DT><A HREF="https://example.com/milliseconds" ADD_DATE="1650000000000">Milliseconds</A>
<DT><A HREF="https://example.com/word" ADD_DATE="yesterday">Word</A>
<DT><A HREF="https://example.com/iso" ADD_DATE="2021-01-01T00:00:00Z">ISO date</A>
<DT><A HREF="https://example.com/too-big" ADD_DATE="1650000000000000">Too big</A>
<DT><A HREF="https://example.com/old" ADD_DATE="1500000000">Old</A>
</DL><p>
</DL><p>
`
      );
      expect(result).toEqual({ response: "Success.", status: 200 });

      const links = await linksById(user.id);
      expect(
        links.map((link) => [link.name, link.importDate?.toISOString() ?? null])
      ).toEqual([
        ["Old", "2017-07-14T02:40:00.000Z"],
        ["Milliseconds", "2022-04-15T05:20:00.000Z"],
        ["Seconds", "2023-11-14T22:13:20.000Z"],
        ["Word", null],
        ["ISO date", null],
        ["Too big", null],
      ]);
    });
  });

  describe("Linkwarden backups", () => {
    it("restores a backup written by exportData with its details, oldest first", async () => {
      // Its links were added newest first and one was updated afterwards, as
      // preserving does, so the backup doesn't list them by date
      const source = await createTestUser();
      const collection = (name: string, extra = {}) =>
        prisma.collection.create({
          data: { name, ownerId: source.id, createdById: source.id, ...extra },
        });
      const reading = await collection("Reading", {
        description: "Long reads",
        color: "#123456",
      });
      const child = await collection("Child", { parentId: reading.id });
      const recipes = await collection("Recipes");

      let order = 0;
      const link = (
        data: {
          url: string | null;
          name: string;
          collectionId: number;
          createdAt: Date;
          description?: string;
          importDate?: Date;
          type?: string;
        },
        tags: string[] = []
      ) =>
        prisma.link.create({
          data: {
            createdById: source.id,
            collectionOrder: (order += 65536),
            ...data,
            tags: {
              connectOrCreate: tags.map((name) => ({
                where: { name_ownerId: { name, ownerId: source.id } },
                create: { name, ownerId: source.id },
              })),
            },
          },
        });

      const newest = await link(
        {
          url: "https://example.com/reading-2024",
          name: "Reading 2024",
          description: "Newest",
          collectionId: reading.id,
          createdAt: new Date("2024-03-01T10:00:00.000Z"),
        },
        ["news"]
      );
      await link(
        {
          url: "https://example.com/child-2023",
          name: "Child 2023",
          collectionId: child.id,
          createdAt: new Date("2023-07-01T10:00:00.000Z"),
          // A date from an earlier import wins over the date it was added
          importDate: new Date("2019-02-01T10:00:00.000Z"),
        },
        ["news", "tech"]
      );
      const pinned = await link({
        url: "https://example.com/recipes-2022",
        name: "Recipes 2022",
        collectionId: recipes.id,
        createdAt: new Date("2022-05-01T10:00:00.000Z"),
      });
      await link({
        url: null,
        type: "pdf",
        name: "Uploaded file",
        collectionId: reading.id,
        createdAt: new Date("2021-09-01T10:00:00.000Z"),
      });
      await link(
        {
          url: "https://example.com/reading-2020",
          name: "Reading 2020",
          collectionId: reading.id,
          createdAt: new Date("2020-01-01T10:00:00.000Z"),
        },
        ["tech"]
      );
      await prisma.user.update({
        where: { id: source.id },
        data: {
          pinnedLinks: { connect: [{ id: newest.id }, { id: pinned.id }] },
        },
      });
      await prisma.link.update({
        where: { id: newest.id },
        data: { textContent: "Preserved", lastPreserved: new Date() },
      });

      const backup = await exportData(source.id);
      expect(backup.status).toBe(200);
      const file = JSON.stringify(backup.response);

      const target = await createTestUser();
      const result = await importFromLinkwarden(target.id, file);
      expect(result).toEqual({ response: "Success.", status: 200 });

      // Collections come back flattened, in the order the backup lists them,
      // which exportData leaves to the database
      const collections = await prisma.collection.findMany({
        where: { ownerId: target.id },
        orderBy: { id: "asc" },
      });
      expect(collections.map((collection) => collection.name)).toEqual(
        (JSON.parse(file) as Backup).collections.map(
          (collection) => collection.name
        )
      );
      expect(
        collections
          .map(({ name, description, color, parentId }) => ({
            name,
            description,
            color,
            parentId,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      ).toEqual([
        { name: "Child", description: "", color: "#0ea5e9", parentId: null },
        {
          name: "Reading",
          description: "Long reads",
          color: "#123456",
          parentId: null,
        },
        { name: "Recipes", description: "", color: "#0ea5e9", parentId: null },
      ]);

      const links = await linksById(target.id);
      expect(
        links.map((link) => ({
          name: link.name,
          url: link.url,
          description: link.description,
          importDate: link.importDate?.toISOString(),
          collection: link.collection.name,
          tags: link.tags.map((tag) => tag.name),
          pinned: link.pinnedBy.length > 0,
        }))
      ).toEqual([
        {
          name: "Child 2023",
          url: "https://example.com/child-2023",
          description: "",
          importDate: "2019-02-01T10:00:00.000Z",
          collection: "Child",
          tags: ["news", "tech"],
          pinned: false,
        },
        {
          name: "Reading 2020",
          url: "https://example.com/reading-2020",
          description: "",
          importDate: "2020-01-01T10:00:00.000Z",
          collection: "Reading",
          tags: ["tech"],
          pinned: false,
        },
        {
          name: "Uploaded file",
          url: null,
          description: "",
          importDate: "2021-09-01T10:00:00.000Z",
          collection: "Reading",
          tags: [],
          pinned: false,
        },
        {
          name: "Recipes 2022",
          url: "https://example.com/recipes-2022",
          description: "",
          importDate: "2022-05-01T10:00:00.000Z",
          collection: "Recipes",
          tags: [],
          pinned: true,
        },
        {
          name: "Reading 2024",
          url: "https://example.com/reading-2024",
          description: "Newest",
          importDate: "2024-03-01T10:00:00.000Z",
          collection: "Reading",
          tags: ["news"],
          pinned: true,
        },
      ]);

      // Each collection's custom order starts out newest first
      const reread = links.filter((link) => link.collection.name === "Reading");
      expect(
        [...reread]
          .sort((a, b) => b.collectionOrder - a.collectionOrder)
          .map((link) => link.name)
      ).toEqual(["Reading 2024", "Uploaded file", "Reading 2020"]);
    });

    // Tags were once looked up by their name as written but created trimmed, so a
    // second spelling collided with the first and stopped the import, which still
    // answered "Success."
    it.each([
      { links: "the newer one adds a space", newer: "news ", older: "news" },
      { links: "the older one adds a space", newer: "news", older: "news " },
      { links: "both add a space", newer: " news", older: " news" },
    ])(
      "imports every link of a backup whose tag names differ only by spaces, when $links",
      async ({ newer, older }) => {
        const user = await createTestUser();

        const result = await importFromLinkwarden(
          user.id,
          JSON.stringify({
            collections: [
              {
                name: "Tags",
                links: [
                  {
                    url: "https://example.com/newer",
                    name: "Newer",
                    createdAt: "2023-01-01T00:00:00.000Z",
                    tags: [{ name: newer }],
                  },
                  {
                    url: "https://example.com/older",
                    name: "Older",
                    createdAt: "2020-01-01T00:00:00.000Z",
                    tags: [{ name: older }],
                  },
                  {
                    url: "https://example.com/both",
                    name: "Both spellings",
                    createdAt: "2024-01-01T00:00:00.000Z",
                    tags: [{ name: newer }, { name: older }],
                  },
                ],
              },
            ],
            pinnedLinks: [],
          })
        );
        expect(result).toEqual({ response: "Success.", status: 200 });

        const links = await linksById(user.id);
        expect(
          links.map((link) => [link.name, link.tags.map((tag) => tag.name)])
        ).toEqual([
          ["Older", ["news"]],
          ["Newer", ["news"]],
          ["Both spellings", ["news"]],
        ]);
      }
    );

    it("sets a backup's pins before the import answers", async () => {
      const user = await createTestUser();

      // Holds each pin back, as a busy database would, so a pin the import
      // doesn't wait for lands only after it has answered
      const update = prisma.link.update;
      const slowUpdate = vi
        .spyOn(prisma.link, "update")
        .mockImplementation(((args: Parameters<typeof update>[0]) =>
          new Promise((resolve) => setTimeout(resolve, 200)).then(() =>
            update.call(prisma.link, args)
          )) as unknown as typeof update);

      try {
        await importFromLinkwarden(
          user.id,
          JSON.stringify({
            collections: [
              {
                name: "Pins",
                links: [
                  {
                    url: "https://example.com/pinned",
                    name: "Pinned",
                    createdAt: "2023-01-01T00:00:00.000Z",
                    tags: [],
                  },
                  {
                    url: "https://example.com/not-pinned",
                    name: "Not pinned",
                    createdAt: "2020-01-01T00:00:00.000Z",
                    tags: [],
                  },
                ],
              },
            ],
            pinnedLinks: [{ url: "https://example.com/pinned" }],
          })
        );

        expect(slowUpdate).toHaveBeenCalledTimes(1);
        const pinned = await prisma.link.findMany({
          where: { pinnedBy: { some: { id: user.id } } },
          select: { url: true },
        });
        expect(pinned.map((link) => link.url)).toEqual([
          "https://example.com/pinned",
        ]);
      } finally {
        slowUpdate.mockRestore();
      }
    });
  });

  // A value the database can't store stops an import at that link. Those links
  // go last, so everything else in the file is saved before it stops.
  describe("dates an import can't store", () => {
    it("saves every other link of a Linkwarden backup before a link without dates stops it", async () => {
      const user = await createTestUser();

      const result = await importFromLinkwarden(
        user.id,
        JSON.stringify({
          collections: [
            {
              name: "A",
              links: [
                {
                  url: "https://example.com/a-new",
                  name: "A new",
                  createdAt: "2022-01-01T00:00:00.000Z",
                  tags: [],
                },
                {
                  url: "https://example.com/undated",
                  name: "Undated",
                  tags: [],
                },
                {
                  url: "https://example.com/a-old",
                  name: "A old",
                  createdAt: "2020-01-01T00:00:00.000Z",
                  tags: [],
                },
              ],
            },
            {
              name: "B",
              links: [
                {
                  url: "https://example.com/b",
                  name: "B",
                  createdAt: "2021-01-01T00:00:00.000Z",
                  tags: [],
                },
              ],
            },
          ],
          pinnedLinks: [],
        })
      );
      expect(result).toEqual({ response: "Success.", status: 200 });

      expect((await linksById(user.id)).map((link) => link.name)).toEqual([
        "A old",
        "B",
        "A new",
      ]);
    });

    it("saves every other row of a Pocket export before a time_added that isn't a number stops it", async () => {
      const user = await createTestUser();

      await importFromPocket(
        user.id,
        [
          "title,url,time_added,cursor,tags,status",
          "New,https://example.com/new,1700000000,,,unread",
          "Bad,https://example.com/bad,yesterday,,,unread",
          "Undated,https://example.com/undated,,,,unread",
          "Old,https://example.com/old,1400000000,,,unread",
        ].join("\n")
      );

      expect((await linksById(user.id)).map((link) => link.name)).toEqual([
        "Old",
        "New",
        "Undated",
      ]);
    });

    it("saves every other item of an Omnivore export before a savedAt that isn't a date stops it", async () => {
      const user = await createTestUser();

      await expect(
        importFromOmnivore(
          user.id,
          JSON.stringify([
            {
              url: "https://example.com/new",
              title: "New",
              savedAt: "2024-01-01T00:00:00.000Z",
              labels: [],
            },
            {
              url: "https://example.com/bad",
              title: "Bad",
              savedAt: "soon",
              labels: [],
            },
            {
              url: "https://example.com/undated",
              title: "Undated",
              labels: [],
            },
            {
              url: "https://example.com/old",
              title: "Old",
              savedAt: "2020-01-01T00:00:00.000Z",
              labels: [],
            },
          ])
        )
      ).rejects.toThrow(/Provided Date object is invalid/);

      expect((await linksById(user.id)).map((link) => link.name)).toEqual([
        "Old",
        "New",
        "Undated",
      ]);
    });

    it("saves every other entry of a Wallabag export before a created_at it can't read stops it", async () => {
      const user = await createTestUser();

      await importFromWallabag(
        user.id,
        JSON.stringify([
          {
            id: 1,
            url: "https://example.com/garbage",
            title: "Garbage",
            created_at: "not a date",
            tags: [],
          },
          {
            id: 2,
            url: "https://example.com/new",
            title: "New",
            created_at: "2023-05-10T08:26:39+0200",
            tags: [],
          },
          {
            id: 3,
            url: "https://example.com/undated",
            title: "Undated",
            tags: [],
          },
          {
            id: 4,
            url: "https://example.com/old",
            title: "Old",
            created_at: "2020-05-10T08:26:39+0200",
            tags: [],
          },
        ])
      );

      expect(
        (await linksById(user.id)).map((link) => [
          link.name,
          link.importDate?.toISOString() ?? null,
        ])
      ).toEqual([
        ["Old", "2020-05-10T06:26:39.000Z"],
        ["New", "2023-05-10T06:26:39.000Z"],
        ["Undated", null],
      ]);
    });
  });

  describe("other accounts", () => {
    it("never adds to another account's collections or tags, even a collection shared with the importer", async () => {
      const other = await createTestUser();
      const othersRecipes = await prisma.collection.create({
        data: { name: "Recipes", ownerId: other.id, createdById: other.id },
      });
      const othersImports = await prisma.collection.create({
        data: { name: "Imports", ownerId: other.id, createdById: other.id },
      });
      const user = await createTestUser();
      const shared = await prisma.collection.create({
        data: {
          name: "Shared",
          ownerId: other.id,
          createdById: other.id,
          members: {
            create: {
              userId: user.id,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            },
          },
        },
      });
      const othersTag = await prisma.tag.create({
        data: { name: "food", ownerId: other.id },
      });

      // Urls no other test file uses, since some look links up by url alone
      await importFromHTMLFile(
        user.id,
        `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
<DT><A HREF="https://example.com/accounts-root" ADD_DATE="1700000000" TAGS="food">Root</A>
<DT><H3>Recipes</H3>
<DL><p>
<DT><A HREF="https://example.com/accounts-soup" ADD_DATE="1650000000" TAGS="food">Soup</A>
</DL><p>
<DT><H3>Shared</H3>
<DL><p>
<DT><A HREF="https://example.com/accounts-shared" ADD_DATE="1600000000">Shared</A>
</DL><p>
</DL><p>
`
      );

      const links = await linksById(user.id);
      expect(links.map((link) => link.name).sort()).toEqual([
        "Root",
        "Shared",
        "Soup",
      ]);
      for (const link of links) {
        expect(link.collection.ownerId).toBe(user.id);
        for (const tag of link.tags) expect(tag.ownerId).toBe(user.id);
      }

      expect(
        await prisma.link.count({
          where: {
            collectionId: {
              in: [othersRecipes.id, othersImports.id, shared.id],
            },
          },
        })
      ).toBe(0);
      expect(
        await prisma.link.count({
          where: { tags: { some: { id: othersTag.id } } },
        })
      ).toBe(0);
    });
  });
});
