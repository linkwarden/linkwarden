# @linkwarden/mcp

A read-only [Model Context Protocol](https://modelcontextprotocol.io) server that exposes a Linkwarden user's own library — collections, links, readable/archived content, and highlights — to MCP-compatible AI agents (Claude Desktop, Claude Code, etc.).

It authenticates with a personal access token, so access is scoped to whatever that token's owner can already see in Linkwarden — no new permission model.

## Configuration

| Env var            | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `LINKWARDEN_URL`   | Base URL of your Linkwarden instance, e.g. `https://links.example.com` |
| `LINKWARDEN_TOKEN` | A personal access token, created under Settings → Access Tokens        |

## Running it

```bash
yarn workspace @linkwarden/mcp build
LINKWARDEN_URL=https://links.example.com LINKWARDEN_TOKEN=... yarn workspace @linkwarden/mcp start
```

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "linkwarden": {
      "command": "node",
      "args": ["/path/to/linkwarden/apps/mcp/dist/index.js"],
      "env": {
        "LINKWARDEN_URL": "https://links.example.com",
        "LINKWARDEN_TOKEN": "..."
      }
    }
  }
}
```

## What it exposes

**Resources**

- `linkwarden://collections` — all collections accessible to the user
- `linkwarden://links/{linkId}` — a single link, including its readable/archived text content
- `linkwarden://links/{linkId}/highlights` — highlights and notes saved on a link

**Tools**

- `search_links` — search links by free text, collection, tag, or pinned status

## Scope

This is intentionally read-only (see [linkwarden/linkwarden#1572](https://github.com/linkwarden/linkwarden/issues/1572)): no tools create, update, or delete anything in Linkwarden. Write access (bookmark/tag/collection management) is deliberately left out of this first version.
