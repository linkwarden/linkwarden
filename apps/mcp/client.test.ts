import { afterEach, describe, expect, it, vi } from "vitest";
import { LinkwardenClient } from "./client";

function mockFetchOnce(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    })
  );
}

describe("LinkwardenClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a bearer token and strips trailing slashes from the base URL", async () => {
    mockFetchOnce({ response: [] });

    const client = new LinkwardenClient({
      baseUrl: "https://example.com/",
      token: "secret",
    });
    await client.getCollections();

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/v1/collections",
      expect.objectContaining({
        headers: { Authorization: "Bearer secret" },
      })
    );
  });

  it("returns collections from the response envelope", async () => {
    mockFetchOnce({ response: [{ id: 1, name: "Reading list" }] });

    const client = new LinkwardenClient({
      baseUrl: "https://example.com",
      token: "t",
    });
    const collections = await client.getCollections();

    expect(collections).toEqual([{ id: 1, name: "Reading list" }]);
  });

  it("throws with the response body when the API call fails", async () => {
    mockFetchOnce({ response: "Collection is not accessible." }, 401);

    const client = new LinkwardenClient({
      baseUrl: "https://example.com",
      token: "t",
    });

    await expect(client.getLink(1)).rejects.toThrow(/401/);
  });

  it("builds query params for searchLinks", async () => {
    mockFetchOnce({ data: { links: [], nextCursor: null } });

    const client = new LinkwardenClient({
      baseUrl: "https://example.com",
      token: "t",
    });
    await client.searchLinks({
      searchQueryString: "rust",
      collectionId: 3,
      pinnedOnly: true,
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/v1/search?searchQueryString=rust&collectionId=3&pinnedOnly=true",
      expect.anything()
    );
  });
});
