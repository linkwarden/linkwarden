import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { JSDOM } from "jsdom";
import type { Browser } from "playwright";
import { prisma } from "@linkwarden/prisma";
import archiveHandler from "./archiveHandler";

// No browser, network or files here: the page is a stand-in that shows the html
// a test gives it, and what the handlers write to disk goes nowhere
vi.mock("@linkwarden/filesystem", () => ({
  createFolder: vi.fn(),
  createFile: vi.fn(),
  readFile: vi.fn(),
  removeFiles: vi.fn(),
}));
vi.mock("./fetchHeaders", () => ({
  default: vi.fn(async () => new Headers({ "content-type": "text/html" })),
}));
vi.mock("./protectPageRequests", () => ({ default: vi.fn() }));
vi.mock("@linkwarden/lib/ssrf", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@linkwarden/lib/ssrf")>()),
  assertUrlIsSafeForServerSideFetch: vi.fn(),
}));

const createdUserIds: number[] = [];

const ensureTestEnv = async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for archiveHandler."
    );
  }

  vi.stubEnv("NODE_ENV", "test");
  delete process.env.MEILI_HOST;
  delete process.env.DISABLE_BROWSER;
  delete process.env.DISABLE_PRESERVATION;
  delete process.env.TEXT_CONTENT_LIMIT;
};

// A link whose owner keeps only the formats in `archiveAs`
const createTestLink = async (archiveAs: { readable?: boolean } = {}) => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      username: `archive_handler_test_${suffix}`,
      email: `archive_handler_test_${suffix}@example.com`,
      archiveAsScreenshot: false,
      archiveAsMonolith: false,
      archiveAsPDF: false,
      archiveAsReadable: archiveAs.readable ?? false,
      archiveAsWaybackMachine: false,
    },
  });
  createdUserIds.push(user.id);

  const collection = await prisma.collection.create({
    data: { name: "Archive test", ownerId: user.id, createdById: user.id },
  });

  const { id } = await prisma.link.create({
    data: {
      url: "https://example.com/article",
      name: "Article",
      collectionId: collection.id,
      createdById: user.id,
      collectionOrder: 1,
      // Already has one, so no screenshot is taken for it
      preview: "unavailable",
    },
  });

  return prisma.link.findUniqueOrThrow({
    where: { id },
    include: { tags: true, collection: { include: { owner: true } } },
  });
};

// Stands in for the browser, with a page that shows `html`. Code the handler
// runs in the page runs against that html.
const browserShowing = (html: string) => {
  const page = {
    goto: vi.fn(),
    setContent: vi.fn(),
    content: vi.fn(async () => html),
    evaluate: vi.fn(async (inPage: () => unknown) => {
      vi.stubGlobal("document", new JSDOM(html).window.document);
      try {
        return inPage();
      } finally {
        vi.unstubAllGlobals();
      }
    }),
  };

  return {
    newContext: vi.fn(async () => ({
      newPage: vi.fn(async () => page),
      close: vi.fn(async () => {}),
    })),
  } as unknown as Browser;
};

beforeAll(async () => {
  await ensureTestEnv();
  await prisma.$connect();
});

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.stubEnv("NODE_ENV", "test");

  for (const id of createdUserIds.splice(0, createdUserIds.length)) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe.sequential("archiveHandler integration", () => {
  // An emoji is two UTF-16 units, so a plain cut keeps half of it, which the
  // database refuses
  it("saves a meta description whose 500-character cut lands in an emoji, and finishes the archive", async () => {
    const link = await createTestLink();
    const description = "d".repeat(499) + "😀 and more";

    await archiveHandler(
      link,
      browserShowing(
        `<html><head><meta name="description" content="${description}"></head><body><p>Hello</p></body></html>`
      )
    );

    const saved = await prisma.link.findUniqueOrThrow({
      where: { id: link.id },
    });
    expect(saved.metaDescription).toBe("d".repeat(499));
    expect(saved.lastPreserved).not.toBeNull();
  });

  it("saves reader text cut to TEXT_CONTENT_LIMIT, wherever the cut lands in an emoji", async () => {
    const article = `<html><head><title>Emoji</title></head><body><article><h1>Emoji</h1><p>${"😀".repeat(
      1200
    )}</p></article></body></html>`;

    // Whatever comes before the emoji in the reader text, one of two limits a
    // unit apart cuts through one
    for (const limit of [1000, 1001]) {
      vi.stubEnv("TEXT_CONTENT_LIMIT", String(limit));
      const link = await createTestLink({ readable: true });

      await archiveHandler(link, browserShowing(article));

      const saved = await prisma.link.findUniqueOrThrow({
        where: { id: link.id },
      });
      expect(saved.readable).toBe(
        `archives/${link.collectionId}/${link.id}_readability.json`
      );
      expect(saved.textContent!.length).toBeGreaterThan(limit - 2);
      expect(saved.textContent!.length).toBeLessThanOrEqual(limit);
      expect(saved.textContent).toMatch(/😀$/);
    }
  });

  // Number() of an unset or empty TEXT_CONTENT_LIMIT is NaN or 0, which must
  // mean no limit: a cut at NaN or 0 would save no reader text at all
  it.each([
    { setting: "not set", value: undefined },
    { setting: "empty", value: "" },
    { setting: "0", value: "0" },
    { setting: "not a number", value: "lots" },
  ])(
    "keeps all of the reader text when TEXT_CONTENT_LIMIT is $setting",
    async ({ value }) => {
      if (value !== undefined) vi.stubEnv("TEXT_CONTENT_LIMIT", value);
      const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
      const article = `<html><head><title>Long</title></head><body><article><h1>Long</h1><p>${words} 😀</p></article></body></html>`;
      const link = await createTestLink({ readable: true });

      await archiveHandler(link, browserShowing(article));

      const saved = await prisma.link.findUniqueOrThrow({
        where: { id: link.id },
      });
      expect(saved.textContent).toContain(words);
      expect(saved.textContent).toMatch(/😀\s*$/);
    }
  );
});
