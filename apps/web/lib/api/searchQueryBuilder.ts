export interface Token {
  field: string;
  value: string;
  isNegative: boolean;
  // Typed as a whole in double quotes, like "exact phrase"
  isPhrase?: boolean;
}

// A search's words and operators, joined by AND and OR
export type SearchNode =
  | { type: "term"; token: Token }
  | { type: "and" | "or"; children: SearchNode[] };

// One Meilisearch search: the text to match, and filters a link has to pass.
// `ranked` is false when it has no words to match, only operators or left out
// words, so there's nothing to rank its links by. `exact` is true when it has
// text in double quotes to match as typed.
export interface SearchBranch {
  q: string;
  filters: string[];
  ranked: boolean;
  exact: boolean;
}

// Meilisearch can't put OR between words, so each alternative is searched on its
// own. `(a OR b) (c OR d)` takes four searches.
export const MAX_SEARCH_BRANCHES = 20;

// Parentheses nested deeper than this are read as text
const MAX_GROUP_DEPTH = 20;

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

// One typed character, or a backslash and the character it escapes. `plain` is
// false inside quotes and for escaped characters, so those never group.
interface Char {
  typed: string;
  value: string;
  plain: boolean;
}

type Item =
  | { kind: "open" | "close" | "and" | "or" | "not" }
  | { kind: "word"; chars: Char[] };

const valueOf = (chars: Char[]) => chars.map((c) => c.value).join("");
const typedOf = (chars: Char[]) => chars.map((c) => c.typed).join("");
const isPlain = (c: Char | undefined, char: string) =>
  !!c && c.plain && c.value === char;
const isParen = (c: Char | undefined, paren: "(" | ")") => isPlain(c, paren);

// Built with the constructor since the web app's TypeScript target predates the u flag
const LETTER_OR_DIGIT = new RegExp("^[\\p{L}\\p{N}]$", "u");
const isLetterOrDigit = (c?: string) => !!c && LETTER_OR_DIGIT.test(c);

// Splits on spaces outside quotes. Quote marks are dropped from the value, and a
// backslash keeps the character after it as it is.
function splitWords(input: string): Char[][] {
  const words: Char[][] = [[]];
  let quoted = false;
  // Line breaks aren't matched by `.`, so they're left out as before
  const unit = /\\?./g;
  let match: RegExpExecArray | null;

  while ((match = unit.exec(input))) {
    const c = match[0];

    // An apostrophe inside a word, like in "what's", doesn't start or end a
    // quote. Outside quotes it's dropped as before, and inside them it stays so
    // a phrase like "what's new" can match.
    if (
      c === "'" &&
      isLetterOrDigit(input[match.index - 1]) &&
      isLetterOrDigit(input[match.index + 1])
    ) {
      words[words.length - 1].push({
        typed: c,
        value: quoted ? c : "",
        plain: false,
      });
    } else if (c === '"' || c === "'") {
      quoted = !quoted;
      words[words.length - 1].push({ typed: c, value: "", plain: false });
    } else if (!quoted && c === " ") {
      words.push([]);
    } else {
      words[words.length - 1].push({
        typed: c,
        value: c.replace(/\\(.)/, "$1"),
        plain: !quoted && c.length === 1,
      });
    }
  }

  return words;
}

// Parentheses at the start or end of a word group the search, unless the word
// pairs them up itself, like the URL `wiki/Foo_(bar)`. An opening one with `!`
// right before it leaves out the links that match the group.
function splitParens(chars: Char[]) {
  const openers: boolean[] = [];
  let start = 0;
  for (;;) {
    if (isParen(chars[start], "(")) {
      openers.push(false);
      start += 1;
    } else if (isPlain(chars[start], "!") && isParen(chars[start + 1], "(")) {
      openers.push(true);
      start += 2;
    } else break;
  }
  let end = chars.length;
  while (end > start && isParen(chars[end - 1], ")")) end--;

  let unclosed = 0;
  let unopened = 0;
  for (const c of chars.slice(start, end)) {
    if (isParen(c, "(")) unclosed++;
    else if (isParen(c, ")")) unclosed > 0 ? unclosed-- : unopened++;
  }

  // The innermost ones the word needs itself stay in it, `!` included
  const opens = openers.slice(
    0,
    openers.length - Math.min(openers.length, unopened)
  );
  const wordStart = opens.reduce((n, negated) => n + (negated ? 2 : 1), 0);
  const closes = chars.length - end - Math.min(chars.length - end, unclosed);
  return { opens, closes, word: chars.slice(wordStart, chars.length - closes) };
}

function toItems(words: Char[][], grouping: boolean): Item[] {
  const items: Item[] = [];

  for (const chars of words) {
    if (!grouping) {
      if (chars.length) items.push({ kind: "word", chars });
      continue;
    }

    const { opens, closes, word } = splitParens(chars);
    for (const negated of opens) {
      if (negated) items.push({ kind: "not" });
      items.push({ kind: "open" });
    }
    if (word.length) items.push({ kind: "word", chars: word });
    for (let i = 0; i < closes; i++) items.push({ kind: "close" });
  }

  return items;
}

function groupsAreBalanced(items: Item[]): boolean {
  let depth = 0;

  for (const item of items) {
    if (item.kind === "open") depth++;
    else if (item.kind === "close") depth--;
    if (depth < 0 || depth > MAX_GROUP_DEPTH) return false;
  }

  return depth === 0;
}

// AND and OR join the words on either side of them. Anywhere else, like at
// the start or end of the search, they're searched as words.
function readKeywords(items: Item[]): Item[] {
  const read: Item[] = [];

  items.forEach((item, i) => {
    const keyword = item.kind === "word" ? typedOf(item.chars) : "";
    const before = read[read.length - 1]?.kind;
    const after = items[i + 1]?.kind;

    if (
      (keyword === "AND" || keyword === "OR") &&
      (before === "word" || before === "close") &&
      (after === "word" || after === "open" || after === "not")
    )
      read.push({ kind: keyword === "AND" ? "and" : "or" });
    else read.push(item);
  });

  return read;
}

// Flips a node, so `!(a OR b)` is `!a !b` and `!(a b)` is `!a OR !b`
function negate(node: SearchNode | null): SearchNode | null {
  if (!node) return null;
  if (node.type === "term")
    return {
      type: "term",
      token: { ...node.token, isNegative: !node.token.isNegative },
    };

  return join(node.type === "and" ? "or" : "and", node.children.map(negate));
}

function join(
  type: "and" | "or",
  nodes: (SearchNode | null)[]
): SearchNode | null {
  const children = nodes
    .filter((node): node is SearchNode => node !== null)
    .flatMap((node) => (node.type === type ? node.children : [node]));

  if (children.length <= 1) return children[0] ?? null;
  return { type, children };
}

// OR binds tighter than AND, like on Google: `a b OR c` is `a (b OR c)`.
// Returns null when nothing is left to search by.
export function parseSearchQuery(searchQueryString: string): SearchNode | null {
  const words = splitWords(searchQueryString);
  let items = toItems(words, true);
  // Parentheses that don't pair up are searched as they're typed
  if (!groupsAreBalanced(items)) items = toItems(words, false);
  items = readKeywords(items);

  const filterLimit = Number(process.env.SEARCH_FILTER_LIMIT);
  let filterCount = 0;
  let pos = 0;

  const term = (chars: Char[]): SearchNode | null => {
    const value = valueOf(chars);
    if (value === "") return null;

    const negatedOperator =
      value.startsWith("!") &&
      SEARCH_CONDITIONS.some((field) => value.startsWith(`!${field}:`));
    const operator = negatedOperator ? value.substring(1) : value;

    for (const field of SEARCH_CONDITIONS) {
      if (
        operator.startsWith(`${field}:`) &&
        operator.length > `${field}:`.length
      ) {
        if (filterLimit && ++filterCount > filterLimit) return null;

        const token = {
          field,
          value: operator.substring(`${field}:`.length),
          isNegative: negatedOperator,
        };
        // Values that don't filter anything, like `before:someday`, are left out
        return operatorFilter(token) === null ? null : { type: "term", token };
      }
    }

    // everything else -> 'general' text. An operator with nothing after it,
    // like `!tag:`, is searched without its `!` as before.
    if (negatedOperator)
      return {
        type: "term",
        token: {
          field: "general",
          value: operator,
          isNegative: false,
          isPhrase: /^"[^"]*"$/.test(typedOf(chars)) && operator.trim() !== "",
        },
      };

    // A `!` in front of a word or a quoted phrase leaves out the links that have it
    const isNegative =
      isPlain(chars[0], "!") &&
      (isLetterOrDigit(chars[1]?.value) || chars[1]?.typed === '"');
    const text = isNegative ? chars.slice(1) : chars;
    const textValue = valueOf(text);
    if (textValue === "") return null;

    const isPhrase = /^"[^"]*"$/.test(typedOf(text)) && textValue.trim() !== "";
    return {
      type: "term",
      token: { field: "general", value: textValue, isNegative, isPhrase },
    };
  };

  const primary = (): SearchNode | null => {
    const item = items[pos++];
    if (item?.kind === "word") return term(item.chars);
    if (item?.kind === "not") return negate(primary());
    if (item?.kind !== "open") return null;

    // The group runs to its closing parenthesis
    const group = all();
    pos++;
    return group;
  };

  const either = (): SearchNode | null => {
    const nodes = [primary()];
    while (items[pos]?.kind === "or") {
      pos++;
      nodes.push(primary());
    }
    return join("or", nodes);
  };

  const all = (): SearchNode | null => {
    const nodes: (SearchNode | null)[] = [];
    while (pos < items.length && items[pos].kind !== "close") {
      if (items[pos].kind === "and") pos++;
      else nodes.push(either());
    }
    return join("and", nodes);
  };

  return all();
}

const hasText = (node: SearchNode): boolean =>
  node.type === "term"
    ? node.token.field === "general"
    : node.children.some(hasText);

// How many searches a node takes, up to one more than the limit
function countBranches(node: SearchNode): number {
  // Operators joined by OR are a single Meilisearch filter
  if (node.type === "term" || !hasText(node)) return 1;

  let total = node.type === "or" ? 0 : 1;
  for (const child of node.children) {
    const count = countBranches(child);
    total = node.type === "or" ? total + count : total * count;
    if (total > MAX_SEARCH_BRANCHES) return MAX_SEARCH_BRANCHES + 1;
  }

  return total;
}

function toFilter(node: SearchNode, userId?: number): string {
  if (node.type === "term") return operatorFilter(node.token, userId) ?? "";

  return node.children
    .map((child) => `(${toFilter(child, userId)})`)
    .join(node.type === "or" ? " OR " : " AND ");
}

function expand(
  node: SearchNode,
  userId?: number
): { words: Token[]; filters: string[] }[] {
  if (node.type === "term")
    return node.token.field === "general"
      ? [{ words: [node.token], filters: [] }]
      : [{ words: [], filters: [toFilter(node, userId)] }];

  if (node.type === "or")
    return hasText(node)
      ? node.children.flatMap((child) => expand(child, userId))
      : [{ words: [], filters: [toFilter(node, userId)] }];

  return node.children.reduce(
    (branches, child) => {
      const options = expand(child, userId);
      return branches.flatMap((branch) =>
        options.map((option) => ({
          words: [...branch.words, ...option.words],
          filters: [...branch.filters, ...option.filters],
        }))
      );
    },
    [{ words: [] as Token[], filters: [] as string[] }]
  );
}

// One search for each alternative the OR operators make, or null when that's
// more than MAX_SEARCH_BRANCHES
export function buildMeiliSearches(
  node: SearchNode | null,
  userId?: number
): SearchBranch[] | null {
  if (!node) return [{ q: "", filters: [], ranked: false, exact: false }];
  if (countBranches(node) > MAX_SEARCH_BRANCHES) return null;

  const searches = new Map<string, SearchBranch>();

  for (const { words, filters } of expand(node, userId)) {
    // Left out words go first: Meilisearch matches the last word as the start
    // of a longer one, and one after it would stop that
    const q = [
      ...words.filter((t) => t.isNegative),
      ...words.filter((t) => !t.isNegative),
    ]
      .map(toMeiliWord)
      .join(" ");
    const ranked = words.some((t) => !t.isNegative && t.value.trim() !== "");
    const exact = words.some(
      (t) => !t.isNegative && toMeiliWord(t).includes('"')
    );

    const key = JSON.stringify([q, filters]);
    if (!searches.has(key)) searches.set(key, { q, filters, ranked, exact });
  }

  return Array.from(searches.values());
}

function toMeiliWord(token: Token): string {
  // Meilisearch matches text in double quotes as an exact phrase
  if (!token.isNegative)
    return token.isPhrase ? `"${token.value}"` : token.value;

  // Meilisearch leaves out links with the word after a `-`, but only up to the
  // first character that splits words (`-foo-bar` would require "bar"), so the
  // whole value goes in quotes. Quotes inside it can't be escaped.
  return `-"${token.value.replace(/"/g, " ")}"`;
}

export function buildAccessFilter({
  userId,
  publicOnly,
}: {
  userId?: number;
  publicOnly?: boolean;
}): string {
  return publicOnly
    ? "collectionIsPublic = true"
    : `(collectionOwnerId = ${userId}) OR (collectionMemberIds = ${userId})`;
}

// The Meilisearch filter for an operator, or null when its value doesn't filter
// anything
function operatorFilter(
  { field, value, isNegative }: Token,
  userId?: number
): string | null {
  switch (field) {
    case "url":
      return isNegative
        ? `NOT url = "${escapeForMeilisearch(value)}"`
        : `url = "${escapeForMeilisearch(value)}"`;

    case "name":
      return isNegative
        ? `NOT name = "${escapeForMeilisearch(value)}"`
        : `name = "${escapeForMeilisearch(value)}"`;

    case "description":
      return isNegative
        ? `NOT description = "${escapeForMeilisearch(value)}"`
        : `description = "${escapeForMeilisearch(value)}"`;

    case "type":
      return isNegative
        ? `NOT type = "${escapeForMeilisearch(value)}"`
        : `type = "${escapeForMeilisearch(value)}"`;

    case "collection":
      return isNegative
        ? `NOT collectionName = "${escapeForMeilisearch(value)}"`
        : `collectionName = "${escapeForMeilisearch(value)}"`;

    case "pinned":
      if (value === "true")
        return isNegative ? `NOT pinnedBy = ${userId}` : `pinnedBy = ${userId}`;
      if (value === "false")
        return isNegative ? `pinnedBy = ${userId}` : `NOT pinnedBy = ${userId}`;
      return null;

    case "public":
      if (value === "true")
        return isNegative
          ? `NOT collectionIsPublic = true`
          : `collectionIsPublic = true`;
      return null;

    case "before":
      if (!isNaN(Date.parse(value))) {
        const creationTimestamp = Date.parse(value) / 1000;
        return isNegative
          ? `creationTimestamp >= ${creationTimestamp}`
          : `creationTimestamp < ${creationTimestamp}`;
      }
      return null;

    case "after":
      if (!isNaN(Date.parse(value))) {
        const creationTimestamp = Date.parse(value) / 1000;
        return isNegative
          ? `creationTimestamp <= ${creationTimestamp}`
          : `creationTimestamp > ${creationTimestamp}`;
      }
      return null;

    case "tag":
      return isNegative
        ? `NOT tags = "${escapeForMeilisearch(value)}"`
        : `tags = "${escapeForMeilisearch(value)}"`;

    // "general" text is handled by the main query, not by filters
    default:
      return null;
  }
}

export function escapeForMeilisearch(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
