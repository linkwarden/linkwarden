#!/usr/bin/env node
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { LinkwardenClient } from "./client.js";
import {
  collectionsToMarkdown,
  highlightsToMarkdown,
  linkToMarkdown,
  linksToMarkdown,
} from "./format.js";

const baseUrl = process.env.LINKWARDEN_URL;
const token = process.env.LINKWARDEN_TOKEN;

if (!baseUrl || !token) {
  console.error(
    "Missing configuration: set LINKWARDEN_URL and LINKWARDEN_TOKEN (a personal access token from your Linkwarden account settings)."
  );
  process.exit(1);
}

const client = new LinkwardenClient({ baseUrl, token });

const server = new McpServer({
  name: "linkwarden",
  version: "0.1.0",
});

server.registerResource(
  "collections",
  "linkwarden://collections",
  {
    title: "Collections",
    description:
      "All Linkwarden collections accessible to the authenticated user",
    mimeType: "text/markdown",
  },
  async (uri) => {
    const collections = await client.getCollections();
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: collectionsToMarkdown(collections),
        },
      ],
    };
  }
);

server.registerResource(
  "link",
  new ResourceTemplate("linkwarden://links/{linkId}", { list: undefined }),
  {
    title: "Link",
    description:
      "A single saved link, including its readable/archived text content",
    mimeType: "text/markdown",
  },
  async (uri, { linkId }) => {
    const link = await client.getLink(Number(linkId));
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: linkToMarkdown(link),
        },
      ],
    };
  }
);

server.registerResource(
  "link-highlights",
  new ResourceTemplate("linkwarden://links/{linkId}/highlights", {
    list: undefined,
  }),
  {
    title: "Link highlights",
    description: "Highlights and notes saved on a link",
    mimeType: "text/markdown",
  },
  async (uri, { linkId }) => {
    const highlights = await client.getLinkHighlights(Number(linkId));
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: highlightsToMarkdown(highlights),
        },
      ],
    };
  }
);

server.registerTool(
  "search_links",
  {
    title: "Search links",
    description:
      "Search the user's Linkwarden library by text query, collection, or tag. Returns matching links without their full readable content — use the linkwarden://links/{linkId} resource to fetch a specific link's content.",
    inputSchema: {
      query: z
        .string()
        .optional()
        .describe("Free-text search over name, URL, description and tags"),
      collectionId: z
        .number()
        .int()
        .optional()
        .describe("Restrict results to this collection id"),
      tagId: z
        .number()
        .int()
        .optional()
        .describe("Restrict results to links with this tag id"),
      pinnedOnly: z.boolean().optional().describe("Only return pinned links"),
      cursor: z
        .number()
        .int()
        .optional()
        .describe("Pagination cursor from a previous call's nextCursor"),
    },
  },
  async ({ query, collectionId, tagId, pinnedOnly, cursor }) => {
    const { links, nextCursor } = await client.searchLinks({
      searchQueryString: query,
      collectionId,
      tagId,
      pinnedOnly,
      cursor,
    });
    const text = nextCursor
      ? `${linksToMarkdown(
          links
        )}\n\n_More results available — pass cursor: ${nextCursor}_`
      : linksToMarkdown(links);
    return { content: [{ type: "text", text }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Linkwarden MCP server running on stdio");
}

main().catch((error) => {
  console.error("Failed to start Linkwarden MCP server:", error);
  process.exit(1);
});
