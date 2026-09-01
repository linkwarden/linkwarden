import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { LinkwardenClient } from "./client.js";
function getConfig() {
    const baseUrl = process.env.LINKWARDEN_URL;
    const apiToken = process.env.LINKWARDEN_TOKEN;
    if (!baseUrl)
        throw new Error("LINKWARDEN_URL environment variable is required");
    if (!apiToken)
        throw new Error("LINKWARDEN_TOKEN environment variable is required");
    return { baseUrl, apiToken };
}
const config = getConfig();
const client = new LinkwardenClient(config);
const server = new Server({ name: "mcp-linkwarden", version: "0.1.0" }, { capabilities: { resources: {}, tools: {} } });
function highlightToMarkdown(h, linkName) {
    const link = linkName ? `**Link:** ${linkName}` : `**Link ID:** ${h.linkId}`;
    const comment = h.comment ? `\n> **Note:** ${h.comment}` : "";
    const color = h.color;
    return `### ${h.text}
- **Color:** ${color}
- ${link}
- **Created:** ${new Date(h.createdAt).toLocaleDateString()}${comment}
`;
}
// ── Resources ────────────────────────────────────────────────────────────────
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "linkwarden://highlights",
                name: "All Highlights",
                description: "All highlights across all links in Linkwarden",
                mimeType: "text/markdown",
            },
            {
                uri: "linkwarden://links",
                name: "All Links",
                description: "All saved links in Linkwarden",
                mimeType: "text/markdown",
            },
            {
                uri: "linkwarden://collections",
                name: "All Collections",
                description: "All collections in Linkwarden",
                mimeType: "text/markdown",
            },
        ],
    };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    switch (uri) {
        case "linkwarden://highlights": {
            const highlights = await client.getAllHighlights();
            const links = await client.getLinks();
            const linkMap = new Map(links.map((l) => [l.id, l.name]));
            const md = highlights.length === 0
                ? "# Highlights\n\nNo highlights found."
                : "# Highlights\n\n" + highlights.map((h) => highlightToMarkdown(h, linkMap.get(h.linkId))).join("\n---\n");
            return { contents: [{ uri, mimeType: "text/markdown", text: md }] };
        }
        case "linkwarden://links": {
            const links = await client.getLinks();
            const md = links.length === 0
                ? "# Links\n\nNo links found."
                : "# Links\n\n" + links.map((l) => `## [${l.name}](${l.url})\n- **ID:** ${l.id}\n- **Collection:** ${l.collectionId}\n- **Created:** ${new Date(l.createdAt).toLocaleDateString()}\n`).join("\n");
            return { contents: [{ uri, mimeType: "text/markdown", text: md }] };
        }
        case "linkwarden://collections": {
            const collections = await client.getCollections();
            const md = collections.length === 0
                ? "# Collections\n\nNo collections found."
                : "# Collections\n\n" + collections.map((c) => `## ${c.name}\n- **ID:** ${c.id}\n- **Public:** ${c.isPublic}\n- **Description:** ${c.description || "None"}\n`).join("\n");
            return { contents: [{ uri, mimeType: "text/markdown", text: md }] };
        }
        default:
            if (uri.startsWith("linkwarden://links/")) {
                const linkId = parseInt(uri.split("/").pop(), 10);
                const link = await client.getLink(linkId);
                if (!link)
                    throw new Error(`Link ${linkId} not found`);
                const highlights = await client.getHighlightsByLink(linkId);
                const highlightsMd = highlights.length === 0
                    ? "\n\n_No highlights on this link._"
                    : "\n\n### Highlights\n\n" + highlights.map(h => highlightToMarkdown(h)).join("\n---\n");
                const md = `# ${link.name}\n- **URL:** ${link.url}\n- **ID:** ${link.id}\n- **Description:** ${link.description || "None"}\n- **Created:** ${new Date(link.createdAt).toLocaleDateString()}\n${highlightsMd}`;
                return { contents: [{ uri, mimeType: "text/markdown", text: md }] };
            }
            throw new Error(`Unknown resource: ${uri}`);
    }
});
// ── Tools ────────────────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_link_highlights",
                description: "Get all highlights for a specific link by ID",
                inputSchema: {
                    type: "object",
                    properties: {
                        linkId: { type: "number", description: "The link ID" },
                    },
                    required: ["linkId"],
                },
            },
            {
                name: "search_highlights",
                description: "Search highlights by text or comment content",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Search term to match against highlight text or comments" },
                    },
                    required: ["query"],
                },
            },
            {
                name: "export_highlights",
                description: "Export all highlights as a markdown document, optionally filtered by collection",
                inputSchema: {
                    type: "object",
                    properties: {
                        collectionId: { type: "number", description: "Optional collection ID to filter by" },
                    },
                },
            },
            {
                name: "find_link_by_url",
                description: "Find a link by its URL",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string", description: "The URL to search for" },
                    },
                    required: ["url"],
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case "get_link_highlights": {
            const { linkId } = args;
            const highlights = await client.getHighlightsByLink(linkId);
            const link = await client.getLink(linkId);
            if (highlights.length === 0) {
                return {
                    content: [{ type: "text", text: `No highlights found for link "${link?.name || linkId}".` }],
                };
            }
            const md = `# Highlights for: ${link?.name || `Link #${linkId}`}\n\n` +
                highlights.map(h => highlightToMarkdown(h)).join("\n---\n");
            return { content: [{ type: "text", text: md }] };
        }
        case "search_highlights": {
            const { query } = args;
            const results = await client.searchHighlights(query);
            if (results.length === 0) {
                return { content: [{ type: "text", text: `No highlights matched "${query}".` }] };
            }
            const md = `# Search Results: "${query}"\n\n` +
                results.map((h) => highlightToMarkdown(h, h.link?.name)).join("\n---\n") +
                `\n\n**${results.length} highlight(s) found.**`;
            return { content: [{ type: "text", text: md }] };
        }
        case "export_highlights": {
            const { collectionId } = (args || {});
            let highlights;
            if (collectionId) {
                const links = await client.getLinks(collectionId);
                highlights = [];
                for (const link of links) {
                    try {
                        const h = await client.getHighlightsByLink(link.id);
                        highlights.push(...h.map((hl) => ({ ...hl, linkName: link.name })));
                    }
                    catch { /* skip */ }
                }
            }
            else {
                const all = await client.getAllHighlights();
                const links = await client.getLinks();
                const linkMap = new Map(links.map((l) => [l.id, l.name]));
                highlights = all.map((h) => ({ ...h, linkName: linkMap.get(h.linkId) }));
            }
            if (highlights.length === 0) {
                return { content: [{ type: "text", text: "No highlights to export." }] };
            }
            const date = new Date().toISOString().split("T")[0];
            const md = `# Linkwarden Highlights Export\n**Date:** ${date}\n**Total:** ${highlights.length} highlights\n\n---\n\n` +
                highlights.map((h) => `## ${h.text}\n- **Color:** ${h.color}\n- **Link:** ${h.linkName || `ID ${h.linkId}`}\n${h.comment ? `- **Note:** ${h.comment}\n` : ""}- **Created:** ${new Date(h.createdAt).toLocaleDateString()}\n`).join("\n---\n");
            return { content: [{ type: "text", text: md }] };
        }
        case "find_link_by_url": {
            const { url } = args;
            const link = await client.getLinkByUrl(url);
            if (!link) {
                return { content: [{ type: "text", text: `No link found for URL: ${url}` }] };
            }
            const highlights = await client.getHighlightsByLink(link.id);
            const highlightsMd = highlights.length === 0
                ? "\n\n_No highlights._"
                : "\n\n### Highlights (" + highlights.length + ")\n\n" + highlights.map(h => highlightToMarkdown(h)).join("\n---\n");
            const md = `# ${link.name}\n- **URL:** ${link.url}\n- **ID:** ${link.id}\n- **Description:** ${link.description || "None"}\n- **Created:** ${new Date(link.createdAt).toLocaleDateString()}\n${highlightsMd}`;
            return { content: [{ type: "text", text: md }] };
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
// ── Start ────────────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("mcp-linkwarden server running on stdio");
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
