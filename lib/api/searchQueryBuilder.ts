interface Token {
  field: string;
  value: string;
}

export function parseSearchTokens(searchQueryString: string): Token[] {
  // Split on whitespace
  const rawTokens = searchQueryString.match(/\S+/g) || [];
  const tokens: Token[] = [];

  for (const token of rawTokens) {
    if (token.startsWith("url:") && token.length > "url:".length) {
      tokens.push({ field: "url", value: token.substring("url:".length) });
    } else if (token.startsWith("name:") && token.length > "name:".length) {
      tokens.push({ field: "name", value: token.substring("name:".length) });
    } else if (
      token.startsWith("description:") &&
      token.length > "description:".length
    ) {
      tokens.push({
        field: "description",
        value: token.substring("description:".length),
      });
    } else if (token.startsWith("type:") && token.length > "type:".length) {
      tokens.push({ field: "type", value: token.substring("type:".length) });
    } else if (token.startsWith("before:") && token.length > "before:".length) {
      tokens.push({
        field: "before",
        value: token.substring("before:".length),
      });
    } else if (token.startsWith("after:") && token.length > "after:".length) {
      if (token.startsWith("after:")) {
        tokens.push({
          field: "after",
          value: token.substring("after:".length),
        });
      }
    } else if (
      token.startsWith("collection:") &&
      token.length > "collection:".length
    ) {
      tokens.push({
        field: "collection",
        value: token.substring("collection:".length),
      });
    } else if (token === "pinned:true" || token === "pinned:false") {
      tokens.push({
        field: "pinned",
        value: token.substring("pinned:".length).toLowerCase(),
      });
    } else if (token.startsWith("#") && token.length > 1) {
      tokens.push({ field: "tag", value: token.substring(1) });
    } else if (token === "public:true") {
      tokens.push({
        field: "public",
        value: token.substring("public:".length).toLowerCase(),
      });
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
      case "url":
        filters.push(`url = "${escapeForMeilisearch(value)}"`);
        break;
      case "name":
        filters.push(`name = "${escapeForMeilisearch(value)}"`);
        break;
      case "description":
        filters.push(`description = "${escapeForMeilisearch(value)}"`);
        break;
      case "type":
        filters.push(`type = "${escapeForMeilisearch(value)}"`);
        break;
      case "collection":
        filters.push(`collectionName = "${escapeForMeilisearch(value)}"`);
        break;
      case "pinned":
        if (value === "true") {
          filters.push(`pinnedBy = ${userId}`);
        } else if (value === "false") {
          filters.push(`NOT pinnedBy = ${userId}`);
        }
        break;
      case "public":
        if (value === "true") {
          filters.push(`collectionIsPublic = true`);
        }
        break;
      case "before":
        if (!isNaN(Date.parse(value))) {
          const creationTimestamp = Date.parse(value) / 1000;
          filters.push(`creationTimestamp < ${creationTimestamp}`);
        }
        break;
      case "after":
        if (!isNaN(Date.parse(value))) {
          const creationTimestamp = Date.parse(value) / 1000;
          filters.push(`creationTimestamp > ${creationTimestamp}`);
        }
        break;
      case "tag":
        filters.push(`tags = "${escapeForMeilisearch(value)}"`);
        break;
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
