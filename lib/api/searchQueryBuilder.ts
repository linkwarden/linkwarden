interface Token {
  field: string;
  value: string;
  isNegative: boolean;
}

const SEARCH_CONDITIONS = [
  "url",
  "name",
  "description",
  "type",
  "collection",
  "pinned",
  "public",
  "before",
  "after",
  "tag",
];

export function parseSearchTokens(searchQueryString: string): Token[] {
  // Split on whitespace
  const rawTokens =
    searchQueryString.match(/\\?.|^$/g)?.reduce(
      (p, c) => {
        if (c === '"' || c === "'") {
          p.quote ^= 1;
        } else if (!p.quote && c === " ") {
          p.str.push("");
        } else {
          p.str[p.str.length - 1] += c.replace(/\\(.)/, "$1");
        }
        return p;
      },
      { str: [""], quote: 0 }
    ).str || [];
  const tokens: Token[] = [];

  for (let token of rawTokens) {
    let isNegative = false;

    if (token.startsWith("!") && token.length > 1) {
      const valueAfterNegation = token.substring(1);

      if (
        SEARCH_CONDITIONS.some((field) =>
          valueAfterNegation.startsWith(`${field}:`)
        )
      ) {
        isNegative = true;
        token = valueAfterNegation;
      }
    }

    let match = false;

    for (const field of SEARCH_CONDITIONS) {
      if (token.startsWith(`${field}:`) && token.length > `${field}:`.length) {
        tokens.push({
          field,
          value: token.substring(`${field}:`.length),
          isNegative,
        });
        match = true;
        break;
      }
    }

    if (!match) {
      // everything else -> 'general' text
      tokens.push({ field: "general", value: token, isNegative });
    }
  }

  const tokensWithoutGeneralField = tokens.filter((t) => t.field !== "general");

  const SEARCH_QUERY_LIMIT = Number(process.env.SEARCH_QUERY_LIMIT);

  if (SEARCH_QUERY_LIMIT)
    return tokensWithoutGeneralField.slice(0, SEARCH_QUERY_LIMIT);

  return tokensWithoutGeneralField;
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

  for (const { field, value, isNegative } of tokens) {
    switch (field) {
      case "url":
        filters.push(
          isNegative
            ? `NOT url = "${escapeForMeilisearch(value)}"`
            : `url = "${escapeForMeilisearch(value)}"`
        );
        break;

      case "name":
        filters.push(
          isNegative
            ? `NOT name = "${escapeForMeilisearch(value)}"`
            : `name = "${escapeForMeilisearch(value)}"`
        );
        break;

      case "description":
        filters.push(
          isNegative
            ? `NOT description = "${escapeForMeilisearch(value)}"`
            : `description = "${escapeForMeilisearch(value)}"`
        );
        break;

      case "type":
        filters.push(
          isNegative
            ? `NOT type = "${escapeForMeilisearch(value)}"`
            : `type = "${escapeForMeilisearch(value)}"`
        );
        break;

      case "collection":
        filters.push(
          isNegative
            ? `NOT collectionName = "${escapeForMeilisearch(value)}"`
            : `collectionName = "${escapeForMeilisearch(value)}"`
        );
        break;

      case "pinned":
        if (value === "true") {
          filters.push(
            isNegative ? `NOT pinnedBy = ${userId}` : `pinnedBy = ${userId}`
          );
        } else if (value === "false") {
          filters.push(
            isNegative ? `pinnedBy = ${userId}` : `NOT pinnedBy = ${userId}`
          );
        }
        break;

      case "public":
        if (value === "true") {
          filters.push(
            isNegative
              ? `NOT collectionIsPublic = true`
              : `collectionIsPublic = true`
          );
        }
        break;

      case "before":
        if (!isNaN(Date.parse(value))) {
          const creationTimestamp = Date.parse(value) / 1000;
          filters.push(
            isNegative
              ? `creationTimestamp >= ${creationTimestamp}`
              : `creationTimestamp < ${creationTimestamp}`
          );
        }
        break;

      case "after":
        if (!isNaN(Date.parse(value))) {
          const creationTimestamp = Date.parse(value) / 1000;
          filters.push(
            isNegative
              ? `creationTimestamp <= ${creationTimestamp}`
              : `creationTimestamp > ${creationTimestamp}`
          );
        }
        break;

      case "tag":
        filters.push(
          isNegative
            ? `NOT tags = "${escapeForMeilisearch(value)}"`
            : `tags = "${escapeForMeilisearch(value)}"`
        );
        break;
      default:
        break;
    }
  }

  return filters;
}

export function escapeForMeilisearch(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
