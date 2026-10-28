import { describe, expect, it } from "vitest";
import {
  collectionsToMarkdown,
  linkToMarkdown,
  linksToMarkdown,
} from "./format";
import type { Link } from "./types";

const escapedLink: Link = {
  id: 236,
  name: "Fight AI Slop &amp; Verify AI Code",
  url: "https://example.com",
  description: "The world&#x27;s largest library",
  type: "url",
  collectionId: 1,
  collection: {
    id: 1,
    name: "Tools &amp; Libs",
    description: "",
    isPublic: false,
    parentId: null,
  },
  tags: [{ id: 1, name: "R&amp;D" }],
  createdAt: "",
  updatedAt: "",
};

describe("format", () => {
  it("decodes HTML entities in link names, descriptions and tags", () => {
    const text = linksToMarkdown([escapedLink]);

    expect(text).toContain("Fight AI Slop & Verify AI Code");
    expect(text).toContain("The world's largest library");
    expect(text).toContain("[R&D]");
    expect(text).not.toContain("&amp;");
  });

  it("decodes HTML entities in a single link and its collection", () => {
    const text = linkToMarkdown(escapedLink);

    expect(text).toContain("# Fight AI Slop & Verify AI Code");
    expect(text).toContain("Collection: Tools & Libs");
    expect(text).toContain("Tags: R&D");
  });

  it("decodes HTML entities in collection names", () => {
    expect(collectionsToMarkdown([escapedLink.collection!])).toContain(
      "**Tools & Libs**"
    );
  });

  it("falls back to the URL when the name is empty", () => {
    expect(linksToMarkdown([{ ...escapedLink, name: "" }])).toContain(
      "**https://example.com**"
    );
  });
});
