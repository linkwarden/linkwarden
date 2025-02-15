interface Token {
  field: string;
  value: string;
}

export function parseSearchTokens(searchQueryString: string): Token[] {
  // Split on whitespace
  const rawTokens = searchQueryString.match(/\S+/g) || [];
  const tokens: Token[] = [];

  for (const token of rawTokens) {
    if (token.startsWith("url:")) {
      tokens.push({ field: "url", value: token.substring("url:".length) });
    } else if (token.startsWith("name:")) {
      tokens.push({ field: "name", value: token.substring("name:".length) });
    } else if (token.startsWith("description:")) {
      tokens.push({
        field: "description",
        value: token.substring("description:".length),
      });
    } else if (token.startsWith("collection:")) {
      tokens.push({
        field: "collection",
        value: token.substring("collection:".length),
      });
    } else if (token.startsWith("pinned:")) {
      tokens.push({
        field: "pinned",
        value: token.substring("pinned:".length).toLowerCase(),
      });
    } else if (token.startsWith("#")) {
      tokens.push({ field: "tag", value: token.substring(1) });
    } else {
      // everything else -> 'general' text
      tokens.push({ field: "general", value: token });
    }
  }

  return tokens;
}

export function buildMeiliQuery(tokens: Token[]): string {
  const generalValues = tokens
    .filter((t) => t.field === "general")
    .map((t) => t.value);

  return generalValues.join(" ");
}

export function buildMeiliFilters(tokens: Token[], userId: number): string[] {
  const filters: string[] = [
    `(collectionOwnerId = ${userId}) OR (collectionMemberIds = ${userId})`,
  ];

  for (const { field, value } of tokens) {
    switch (field) {
      // case "url":
      //   filters.push(`url = "${escapeForMeilisearch(value)}"`);
      //   break;
      // case "name":
      //   filters.push(`name = "${escapeForMeilisearch(value)}"`);
      //   break;
      // case "description":
      //   filters.push(`description = "${escapeForMeilisearch(value)}"`);
      //   break;

      // case "collection":
      //   filters.push(`collectionName = "${escapeForMeilisearch(value)}"`);
      //   break;

      // case "pinned":
      //   if (value === "true") {
      //     filters.push("pinnedBy = ${userId}");
      //   } else if (value === "false") {
      //     filters.push("pinned = false");
      //   }
      //   break;

      // case "tag":
      //   filters.push(`tags = "${escapeForMeilisearch(value)}"`);
      //   break;

      case "general":
      default:
        break;
    }
  }
  return filters;
}

export function escapeForMeilisearch(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
