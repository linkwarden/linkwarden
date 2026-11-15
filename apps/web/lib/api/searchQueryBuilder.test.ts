import { afterEach, describe, expect, it } from "vitest";
import {
  buildAccessFilter,
  buildMeiliSearches,
  escapeForMeilisearch,
  MAX_SEARCH_BRANCHES,
  parseSearchQuery,
} from "./searchQueryBuilder";

const branches = (input: string, userId = 7) =>
  buildMeiliSearches(parseSearchQuery(input), userId);

// Only the text and filters, for the tests that aren't about ranking
const searches = (input: string, userId = 7) =>
  branches(input, userId)?.map(({ q, filters }) => ({ q, filters })) ?? null;

// For searches without OR, which stay a single Meilisearch search
const single = (input: string) => {
  const found = searches(input);
  expect(found).toHaveLength(1);
  return found![0];
};
const query = (input: string) => single(input).q;
const filters = (input: string) => single(input).filters;

const term = (field: string, value: string, isNegative = false) => ({
  type: "term",
  token: expect.objectContaining({ field, value, isNegative }),
});

afterEach(() => {
  delete process.env.SEARCH_FILTER_LIMIT;
});

describe("parseSearchQuery", () => {
  it("splits on spaces and keeps plain words as search text", () => {
    expect(parseSearchQuery("local file organizer")).toEqual({
      type: "and",
      children: [
        term("general", "local"),
        term("general", "file"),
        term("general", "organizer"),
      ],
    });
  });

  it("reads operators, with quotes keeping spaces in a value", () => {
    expect(parseSearchQuery('tag:"ai tools" name:x !collection:Inbox')).toEqual(
      {
        type: "and",
        children: [
          term("tag", "ai tools"),
          term("name", "x"),
          term("collection", "Inbox", true),
        ],
      }
    );
  });

  it("treats an operator with nothing after it, or an unknown one, as text", () => {
    expect(query("tag: title:foo")).toBe("tag: title:foo");
    expect(filters("tag: title:foo")).toEqual([]);
  });

  it("reads ! in front of an operator or a word as leaving it out", () => {
    expect(parseSearchQuery("!tag:news !important")).toEqual({
      type: "and",
      children: [term("tag", "news", true), term("general", "important", true)],
    });
  });

  it("keeps an escaped quote as a character", () => {
    expect(parseSearchQuery('say \\"hi\\"')).toEqual({
      type: "and",
      children: [term("general", "say"), term("general", '"hi"')],
    });
  });

  it("returns nothing for an empty search", () => {
    expect(parseSearchQuery("")).toBeNull();
    expect(parseSearchQuery("   ")).toBeNull();
    expect(branches("")).toEqual([
      { q: "", filters: [], ranked: false, exact: false },
    ]);
  });

  it("caps the number of operators, not the search text, at SEARCH_FILTER_LIMIT", () => {
    process.env.SEARCH_FILTER_LIMIT = "1";

    expect(searches("tag:a word tag:b other")).toEqual([
      { q: "word other", filters: ['tags = "a"'] },
    ]);
    expect(searches("tag:a OR tag:b")).toEqual([
      { q: "", filters: ['tags = "a"'] },
    ]);
  });
});

describe("search text", () => {
  it("sends only the search text, without operators", () => {
    expect(query("organizer tag:ai before:2020-01-01 file")).toBe(
      "organizer file"
    );
  });

  it("sends nothing when there are only operators", () => {
    expect(query("tag:ai pinned:true")).toBe("");
  });

  it("passes a URL through as text", () => {
    expect(query("https://github.com/QiuYannnn/Local-File-Organizer")).toBe(
      "https://github.com/QiuYannnn/Local-File-Organizer"
    );
  });
});

describe("quoted phrases", () => {
  it("sends text typed in double quotes as a phrase", () => {
    expect(query('"file organizer" local')).toBe('"file organizer" local');
  });

  it("only treats a token that's quoted as a whole as a phrase", () => {
    expect(query('half"quoted words"')).toBe("halfquoted words");
    expect(query('"unclosed words')).toBe("unclosed words");
  });

  it("doesn't turn single quotes or apostrophes into phrases", () => {
    expect(query("'single quoted'")).toBe("single quoted");
    expect(query("what's new")).toBe("whats new");
  });

  it("leaves quoted text with escaped quotes inside as typed", () => {
    expect(query('"say \\"hi\\" now"')).toBe('say "hi" now');
  });

  it("keeps escaped quotes as they were", () => {
    expect(query('\\"alice@example.com\\"')).toBe('"alice@example.com"');
  });

  it("ignores empty quotes", () => {
    expect(query('"" words')).toBe("words");
  });

  it("doesn't mark operator values as phrases", () => {
    expect(parseSearchQuery('tag:"ai tools"')).toEqual({
      type: "term",
      token: { field: "tag", value: "ai tools", isNegative: false },
    });
    expect(query('tag:"ai tools" "exact one"')).toBe('"exact one"');
  });
});

describe("apostrophes", () => {
  it("don't start a quote inside a word", () => {
    expect(searches("Bob's notes OR tag:x")).toEqual([
      { q: "Bobs notes", filters: [] },
      { q: "Bobs", filters: ['tags = "x"'] },
    ]);
    expect(filters("tag:'Bob's links' pinned:true")).toEqual([
      `tags = "Bob's links"`,
      "pinnedBy = 7",
    ]);
  });

  it("stay in a quoted phrase, so it can match", () => {
    expect(query(`"what's new" rust`)).toBe(`"what's new" rust`);
  });

  it("still quote at the edges of a word, and before a line break", () => {
    expect(query("'x y' z")).toBe("x y z");
    expect(query("it'\ns OR t")).toBe("its OR t");
  });
});

describe("AND and OR", () => {
  it("searches each side of OR on its own", () => {
    expect(searches("rust OR go")).toEqual([
      { q: "rust", filters: [] },
      { q: "go", filters: [] },
    ]);
  });

  it("binds OR tighter than AND, like Google", () => {
    expect(searches("rust go OR python")).toEqual([
      { q: "rust go", filters: [] },
      { q: "rust python", filters: [] },
    ]);
    expect(searches("tag:work OR tag:home pinned:true")).toEqual([
      {
        q: "",
        filters: ['(tags = "work") OR (tags = "home")', "pinnedBy = 7"],
      },
    ]);
  });

  it("treats AND like a space", () => {
    expect(searches("rust AND go tag:a AND tag:b")).toEqual(
      searches("rust go tag:a tag:b")
    );
  });

  it("only reads uppercase AND and OR as operators", () => {
    expect(query("rock and roll")).toBe("rock and roll");
    expect(query("rust or go")).toBe("rust or go");
    expect(query("rust Or go")).toBe("rust Or go");
  });

  it("searches AND and OR as words where they don't join two things", () => {
    expect(query("OR")).toBe("OR");
    expect(query("rust OR")).toBe("rust OR");
    expect(query("AND rust")).toBe("AND rust");
    expect(query("(OR rust)")).toBe("OR rust");
    expect(query("(rust AND) go")).toBe("rust AND go");
  });

  it("searches quoted or escaped AND and OR as words", () => {
    expect(query('"rock OR roll"')).toBe('"rock OR roll"');
    expect(query('rust "OR" go')).toBe('rust "OR" go');
    expect(query("rust \\OR go")).toBe("rust OR go");
    expect(query("rust ORgo")).toBe("rust ORgo");
  });

  it("puts operators joined by OR into one filter", () => {
    expect(
      searches("tag:a OR !tag:b OR before:2020-01-01 OR pinned:true")
    ).toEqual([
      {
        q: "",
        filters: [
          `(tags = "a") OR (NOT tags = "b") OR (creationTimestamp < ${
            Date.parse("2020-01-01") / 1000
          }) OR (pinnedBy = 7)`,
        ],
      },
    ]);
  });

  it("mixes words and operators", () => {
    expect(searches("tag:recipes OR recipe")).toEqual([
      { q: "", filters: ['tags = "recipes"'] },
      { q: "recipe", filters: [] },
    ]);
  });

  it("leaves out operators that don't filter anything, instead of matching everything", () => {
    expect(searches("tag:a OR before:someday")).toEqual([
      { q: "", filters: ['tags = "a"'] },
    ]);
    expect(searches("rust OR pinned:maybe OR public:false")).toEqual([
      { q: "rust", filters: [] },
    ]);
  });

  it("doesn't run the same search twice", () => {
    expect(searches("rust OR rust")).toEqual([{ q: "rust", filters: [] }]);
  });

  it("keeps an excluded word in its own alternative", () => {
    expect(searches("rust -python OR go")).toEqual([
      { q: "rust -python", filters: [] },
      { q: "rust go", filters: [] },
    ]);
  });

  it("keeps phrases in their alternative", () => {
    expect(searches('"file organizer" OR rust')).toEqual([
      { q: '"file organizer"', filters: [] },
      { q: "rust", filters: [] },
    ]);
  });

  it("reads OR next to another OR as a word", () => {
    expect(searches("a OR OR b")).toEqual([
      { q: "a b", filters: [] },
      { q: "OR b", filters: [] },
    ]);
  });
});

describe("parentheses", () => {
  it("group parts of a search", () => {
    expect(searches("(tag:work OR tag:home) (rust OR go)")).toEqual([
      { q: "rust", filters: ['(tags = "work") OR (tags = "home")'] },
      { q: "go", filters: ['(tags = "work") OR (tags = "home")'] },
    ]);
    expect(searches("(a b) OR c")).toEqual([
      { q: "a b", filters: [] },
      { q: "c", filters: [] },
    ]);
  });

  it("keep the word order inside each alternative", () => {
    expect(searches("a (b OR c) d")).toEqual([
      { q: "a b d", filters: [] },
      { q: "a c d", filters: [] },
    ]);
  });

  it("nest", () => {
    expect(searches("((rust OR go) tag:a) OR (tag:b !tag:c)")).toEqual([
      { q: "rust", filters: ['tags = "a"'] },
      { q: "go", filters: ['tags = "a"'] },
      { q: "", filters: ['tags = "b"', 'NOT tags = "c"'] },
    ]);
    expect(searches("(tag:a tag:b) OR tag:c")).toEqual([
      { q: "", filters: ['((tags = "a") AND (tags = "b")) OR (tags = "c")'] },
    ]);
    expect(searches("(((rust)))")).toEqual([{ q: "rust", filters: [] }]);
  });

  it("group a quoted phrase or a quoted operator value", () => {
    expect(searches('("exact phrase" OR tag:"ai tools")')).toEqual([
      { q: '"exact phrase"', filters: [] },
      { q: "", filters: ['tags = "ai tools"'] },
    ]);
  });

  it("leave the parentheses a word needs, like in a URL", () => {
    const url = 'url = "https://en.wikipedia.org/wiki/Foo_(bar)"';

    expect(filters("url:https://en.wikipedia.org/wiki/Foo_(bar)")).toEqual([
      url,
    ]);
    expect(filters("(url:https://en.wikipedia.org/wiki/Foo_(bar))")).toEqual([
      url,
    ]);
    expect(filters("tag:(draft)")).toEqual(['tags = "(draft)"']);
    expect(query("function()")).toBe("function()");
    expect(query("(foo)bar")).toBe("(foo)bar");
  });

  it("are searched as typed when they don't pair up", () => {
    expect(query("hello :)")).toBe("hello :)");
    expect(query("(x")).toBe("(x");
    expect(query("x)")).toBe("x)");
    expect(searches("(rust OR go")).toEqual([
      { q: "(rust", filters: [] },
      { q: "go", filters: [] },
    ]);
  });

  it("don't group inside quotes or when escaped", () => {
    expect(query('"(a OR b)"')).toBe('"(a OR b)"');
    expect(searches("\\(a OR b\\)")).toEqual([
      { q: "(a", filters: [] },
      { q: "b)", filters: [] },
    ]);
  });

  it("add nothing when empty", () => {
    expect(searches("rust ()")).toEqual([{ q: "rust", filters: [] }]);
    expect(searches("( )")).toEqual([{ q: "", filters: [] }]);
  });

  it("are read as text when nested too deep", () => {
    const deep = (n: number) => `${"(".repeat(n)}rust${")".repeat(n)}`;

    expect(query(deep(20))).toBe("rust");
    expect(query(deep(21))).toBe(deep(21));
  });
});

describe("leaving words out with !", () => {
  it("leaves out a word or a phrase, quoted so Meilisearch reads all of it", () => {
    expect(query("rust !book")).toBe('-"book" rust');
    expect(query('guide !"rust book"')).toBe('-"rust book" guide');
    expect(query("!foo-bar")).toBe('-"foo-bar"');
    expect(query("!https://example.com/page")).toBe(
      '-"https://example.com/page"'
    );
  });

  it("goes before the words, so the last word still matches longer ones", () => {
    expect(query("organ !pantry spice !jar")).toBe(
      '-"pantry" -"jar" organ spice'
    );
    expect(searches("(rust !book) OR (!go python)")).toEqual([
      { q: '-"book" rust', filters: [] },
      { q: '-"go" python', filters: [] },
    ]);
  });

  it("can't break out of the quotes", () => {
    expect(query('!"say \\"hi\\""')).toBe('-"say  hi "');
    expect(query('!a\\"b')).toBe('-"a b"');
  });

  it("keeps ! as text when it isn't in front of a word", () => {
    for (const text of ["!", "!!", "!?x", "hello!", "!-x", "!'a b'"])
      expect(branches(text)).toEqual([
        expect.objectContaining({ ranked: true }),
      ]);
    expect(query("!")).toBe("!");
    expect(query("!!")).toBe("!!");
    expect(query("hello!")).toBe("hello!");
  });

  it("keeps ! as text when quoted or escaped", () => {
    expect(query('"!important"')).toBe('"!important"');
    expect(query("\\!important")).toBe("!important");
  });

  it("searches an operator with nothing after it as text, like before", () => {
    expect(query("!tag:")).toBe("tag:");
    expect(query("!before:")).toBe("before:");
  });

  it("leaves Meilisearch's own - as it was", () => {
    expect(branches("rust -book")).toEqual([
      { q: "rust -book", filters: [], ranked: true, exact: false },
    ]);
  });
});

describe("leaving groups out with !( )", () => {
  it("flips what's inside", () => {
    expect(searches("!(tag:a OR book)")).toEqual([
      { q: '-"book"', filters: ['NOT tags = "a"'] },
    ]);
    expect(searches("!(tag:a OR tag:b)")).toEqual([
      { q: "", filters: ['NOT tags = "a"', 'NOT tags = "b"'] },
    ]);
    expect(searches("!(a b)")).toEqual([
      { q: '-"a"', filters: [] },
      { q: '-"b"', filters: [] },
    ]);
    expect(searches("!(rust OR go) python")).toEqual([
      { q: '-"rust" -"go" python', filters: [] },
    ]);
  });

  it("flips operators that are already negated or false", () => {
    expect(searches("!(!tag:a)")).toEqual([{ q: "", filters: ['tags = "a"'] }]);
    expect(searches("!(pinned:false OR before:2020-01-01)")).toEqual([
      {
        q: "",
        filters: [
          "pinnedBy = 7",
          `creationTimestamp >= ${Date.parse("2020-01-01") / 1000}`,
        ],
      },
    ]);
  });

  it("nests and mixes with OR", () => {
    expect(searches("rust OR !(tag:a (go OR python))")).toEqual([
      { q: "rust", filters: [] },
      { q: "", filters: ['NOT tags = "a"'] },
      { q: '-"go" -"python"', filters: [] },
    ]);
    expect(searches("!(!(rust))")).toEqual([{ q: "rust", filters: [] }]);
  });

  it("is text when the parentheses don't pair up or the ! isn't right before them", () => {
    expect(query("!(tag:a")).toBe("!(tag:a");
    expect(query("!(foo)bar")).toBe("!(foo)bar");
    expect(query("! (rust)")).toBe("! rust");
  });

  it("ignores an empty group", () => {
    expect(searches("rust !()")).toEqual([{ q: "rust", filters: [] }]);
  });

  it("counts toward the number of searches", () => {
    expect(branches("!(a b c d e f g h i j k l m n o p q r s t)")).toHaveLength(
      20
    );
    expect(branches("!(a b c d e f g h i j k l m n o p q r s t u)")).toBeNull();
  });
});

describe("ranked and exact", () => {
  it("marks searches with words to match as ranked", () => {
    expect(branches("rust tag:a")![0].ranked).toBe(true);
    expect(branches('"rust book"')![0].ranked).toBe(true);
    expect(branches("tag:a")![0].ranked).toBe(false);
    expect(branches("!rust tag:a")![0].ranked).toBe(false);
    expect(branches('" "')![0].ranked).toBe(false);
  });

  it("marks searches with a phrase to match as exact, but not one left out", () => {
    expect(branches('"rust book"')![0].exact).toBe(true);
    expect(branches('\\"alice@example.com\\"')![0].exact).toBe(true);
    expect(branches('rust !"go book"')![0].exact).toBe(false);
    expect(branches("rust")![0].exact).toBe(false);
  });

  it("marks each alternative on its own", () => {
    expect(
      branches('"exact one" OR rust OR !go OR tag:a')!.map(
        ({ ranked, exact }) => ({ ranked, exact })
      )
    ).toEqual([
      { ranked: true, exact: true },
      { ranked: true, exact: false },
      { ranked: false, exact: false },
      { ranked: false, exact: false },
    ]);
  });
});

describe("number of searches", () => {
  const ored = (n: number, word = "w") =>
    Array.from({ length: n }, (_, i) => `${word}${i}`).join(" OR ");

  it(`allows up to ${MAX_SEARCH_BRANCHES}`, () => {
    expect(searches(ored(MAX_SEARCH_BRANCHES))).toHaveLength(
      MAX_SEARCH_BRANCHES
    );
    expect(searches(ored(MAX_SEARCH_BRANCHES + 1))).toBeNull();
  });

  it("counts every combination of OR groups", () => {
    expect(searches("(a OR b) (c OR d) (e OR f) (g OR h)")).toHaveLength(16);
    expect(searches("(a OR b) (c OR d) (e OR f) (g OR h) (i OR j)")).toBeNull();
  });

  it("doesn't count operators joined by OR", () => {
    expect(searches(ored(200, "tag:t"))).toHaveLength(1);
  });

  it("stops counting early on a huge search", () => {
    const huge = "(a OR b) ".repeat(5000);
    const started = Date.now();

    expect(searches(huge)).toBeNull();
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe("filters", () => {
  it("limit a user's search to collections they own or are a member of", () => {
    expect(buildAccessFilter({ userId: 7 })).toBe(
      "(collectionOwnerId = 7) OR (collectionMemberIds = 7)"
    );
  });

  it("limit a public search to public collections", () => {
    expect(buildAccessFilter({ publicOnly: true })).toBe(
      "collectionIsPublic = true"
    );
  });

  it("come from each operator", () => {
    expect(
      filters(
        'url:https://a.test name:"A b" description:d type:pdf collection:Inbox tag:ai pinned:true public:true'
      )
    ).toEqual([
      'url = "https://a.test"',
      'name = "A b"',
      'description = "d"',
      'type = "pdf"',
      'collectionName = "Inbox"',
      'tags = "ai"',
      "pinnedBy = 7",
      "collectionIsPublic = true",
    ]);
  });

  it("are negated with !", () => {
    expect(
      filters("!tag:news !pinned:true !collection:Inbox pinned:false")
    ).toEqual([
      'NOT tags = "news"',
      "NOT pinnedBy = 7",
      'NOT collectionName = "Inbox"',
      "NOT pinnedBy = 7",
    ]);
  });

  it("turn dates into timestamps and drop ones that don't parse", () => {
    expect(filters("before:2020-01-01 after:2019-01-01 before:nope")).toEqual([
      `creationTimestamp < ${Date.parse("2020-01-01") / 1000}`,
      `creationTimestamp > ${Date.parse("2019-01-01") / 1000}`,
    ]);
  });

  it("keep a crafted value inside its quotes", () => {
    expect(
      filters('tag:"x\\" OR collectionOwnerId > 0 OR tags = \\"y"')
    ).toEqual(['tags = "x\\" OR collectionOwnerId > 0 OR tags = \\"y"']);

    expect(
      searches('tag:"x\\") OR (collectionOwnerId > 0" OR tag:y')![0].filters
    ).toEqual(['(tags = "x\\") OR (collectionOwnerId > 0") OR (tags = "y")']);
  });
});

describe("escapeForMeilisearch", () => {
  it("escapes backslashes before quotes", () => {
    expect(escapeForMeilisearch('a\\"b')).toBe('a\\\\\\"b');
  });
});
