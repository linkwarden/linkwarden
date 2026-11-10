import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { getCollections, ResponseCollections } from "./collections.ts";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));

// A walk that goes round a parent cycle reads `parent` forever, growing the
// path until the heap runs out, so give up after 100 reads instead
let parentReads = 0;

// A collection as the API returns it, naming its parent
const collection = (
  id: number,
  name: string,
  parent: { id: number; name: string } | null = null
) =>
  Object.defineProperty(
    {
      id,
      name,
      parentId: parent?.id ?? null,
      color: "#0ea5e9",
      createdAt: "2026-10-28T00:00:00.000Z",
      description: "",
      isPublic: false,
      members: [],
      ownerId: 1,
      updatedAt: "2026-10-28T00:00:00.000Z",
    },
    "parent",
    {
      enumerable: true,
      get() {
        if (++parentReads > 100)
          throw new Error("Still walking up after 100 steps");
        return parent;
      },
    }
  ) as ResponseCollections;

// Each collection's name mapped to the path the extension shows for it
const pathnames = async (collections: ResponseCollections[]) => {
  vi.mocked(axios.get).mockResolvedValue({ data: { response: collections } });

  const result = await getCollections(
    "https://links.example.com",
    "secret-token"
  );

  return Object.fromEntries(
    result.data.response.map((c) => [c.name, c.pathname])
  );
};

beforeEach(() => {
  parentReads = 0;
  vi.mocked(axios.get).mockReset();
});

describe("getCollections", () => {
  it("shows each collection under the full path of its parents", async () => {
    const reading = { id: 1, name: "Reading" };
    const articles = { id: 2, name: "Articles" };

    expect(
      await pathnames([
        collection(1, "Reading"),
        collection(2, "Articles", reading),
        collection(3, "Long reads", articles),
      ])
    ).toEqual({
      Reading: "Reading",
      Articles: "Reading > Articles",
      "Long reads": "Reading > Articles > Long reads",
    });
    expect(axios.get).toHaveBeenCalledWith(
      "https://links.example.com/api/v1/collections",
      { headers: { Authorization: "Bearer secret-token" } }
    );
  });

  it("names a parent that isn't in the list and stops there", async () => {
    // A sub-collection shared with the user, whose parent isn't
    expect(
      await pathnames([collection(2, "Shared", { id: 1, name: "Private" })])
    ).toEqual({ Shared: "Private > Shared" });
  });

  it("stops at a collection that is its own parent", async () => {
    expect(
      await pathnames([collection(1, "Loop", { id: 1, name: "Loop" })])
    ).toEqual({ Loop: "Loop" });
  });

  it("stops when the parents loop back round", async () => {
    const first = { id: 1, name: "First" };
    const second = { id: 2, name: "Second" };
    const third = { id: 3, name: "Third" };

    expect(
      await pathnames([
        collection(1, "First", third),
        collection(2, "Second", first),
        collection(3, "Third", second),
        collection(4, "Inside", second),
      ])
    ).toEqual({
      First: "Second > Third > First",
      Second: "Third > First > Second",
      Third: "First > Second > Third",
      Inside: "Third > First > Second > Inside",
    });
  });
});
