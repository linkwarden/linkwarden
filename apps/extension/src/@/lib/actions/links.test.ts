import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkLinkExists, postLinkFetch } from "./links.ts";

// screenshot.ts loads webextension-polyfill, which refuses to run outside an
// extension, and none of these tests take a screenshot.
vi.mock("../screenshot.ts", () => ({ default: vi.fn() }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("postLinkFetch", () => {
  it("posts the link as JSON with the API key", async () => {
    fetchMock.mockResolvedValue(Response.json({ response: { id: 1 } }));
    const link = {
      url: "https://example.com/article",
      name: "An article",
      description: "An article",
      collection: { name: "Unorganized" },
      tags: [],
    };

    await postLinkFetch("https://links.example.com", link, "secret-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://links.example.com/api/v1/links",
      {
        method: "POST",
        body: JSON.stringify(link),
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer secret-token",
        },
      }
    );
  });
});

describe("checkLinkExists", () => {
  it("searches the instance for the exact URL", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ data: { links: [{ id: 1 }] } })
    );

    const exists = await checkLinkExists(
      "https://links.example.com",
      "secret-token",
      "https://example.com/a b?x=1&y=2"
    );

    expect(exists).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://links.example.com/api/v1/search?sort=0&searchQueryString=" +
        encodeURIComponent("url:https://example.com/a b?x=1&y=2"),
      { headers: { Authorization: "Bearer secret-token" } }
    );
  });

  it("is false when the search finds nothing", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: { links: [] } }));

    expect(
      await checkLinkExists("https://links.example.com", "token", "https://a")
    ).toBe(false);
  });

  it("is false when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(
      await checkLinkExists("https://links.example.com", "token", "https://a")
    ).toBe(false);
  });

  it("skips the request when something is missing", async () => {
    expect(await checkLinkExists("", "token", "https://a")).toBe(false);
    expect(
      await checkLinkExists("https://links.example.com", "", "https://a")
    ).toBe(false);
    expect(
      await checkLinkExists("https://links.example.com", "token", undefined)
    ).toBe(false);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
