import { describe, expect, it } from "vitest";
import { getLinkPlaceholder, getSiteName } from "./linkPlaceholder";

describe("getSiteName", () => {
  it("names a site by the label before its suffix", () => {
    expect(getSiteName("https://example.com/a")).toBe("example");
    expect(getSiteName("https://www.example.com")).toBe("example");
    expect(getSiteName("https://news.example.com")).toBe("example");
    expect(getSiteName("https://courses.northfield.edu/7")).toBe("northfield");
    expect(getSiteName("https://example.de")).toBe("example");
    expect(getSiteName("https://WWW.Example.COM.")).toBe("example");
  });

  it("skips second-level suffixes under a country code", () => {
    expect(getSiteName("https://www.bbc.co.uk/news")).toBe("bbc");
    expect(getSiteName("https://abc.net.au")).toBe("abc");
    expect(getSiteName("https://blog.foo.de")).toBe("foo");
    expect(getSiteName("https://t.co/x")).toBe("t");
  });

  it("keeps IP addresses and single-label hosts whole", () => {
    expect(getSiteName("http://192.168.1.1:8080/admin")).toBe("192.168.1.1");
    expect(getSiteName("http://[::1]:3000")).toBe("[::1]");
    expect(getSiteName("http://localhost:3000")).toBe("localhost");
    expect(getSiteName("javascript://hi")).toBe("hi");
  });

  it("returns nothing without a usable host", () => {
    expect(getSiteName(undefined)).toBeUndefined();
    expect(getSiteName(null)).toBeUndefined();
    expect(getSiteName("")).toBeUndefined();
    expect(getSiteName("not a url")).toBeUndefined();
    expect(getSiteName("mailto:someone@example.com")).toBeUndefined();
  });
});

describe("getLinkPlaceholder", () => {
  it("gives every link on a site the same color and initial", () => {
    const a = getLinkPlaceholder({ url: "https://example.com/a", name: "A" });
    const b = getLinkPlaceholder({
      url: "https://www.example.com/b",
      name: "B",
    });

    expect(a).toEqual(b);
    expect(a.initial).toBe("E");
    expect(a.color).toMatch(/^oklch\(0\.62 0\.14 \d+\)$/);
  });

  it("uses the link's name when there's no site", () => {
    const pdf = getLinkPlaceholder({
      url: null,
      name: "  q3 board update.pdf",
    });

    expect(pdf.initial).toBe("Q");
    expect(pdf.color).toBe(
      getLinkPlaceholder({ name: "q3 board update.pdf" }).color
    );
  });

  it("skips punctuation when picking the initial", () => {
    expect(getLinkPlaceholder({ name: "  (draft) notes" }).initial).toBe("D");
    expect(getLinkPlaceholder({ name: "#1 idea" }).initial).toBe("1");
    expect(getLinkPlaceholder({ name: "über" }).initial).toBe("Ü");
    expect(getLinkPlaceholder({ name: "日本語" }).initial).toBe("日");
  });

  it("has no initial when there's nothing to take it from", () => {
    expect(getLinkPlaceholder({}).initial).toBeUndefined();
    expect(getLinkPlaceholder({ name: "  ...  " }).initial).toBeUndefined();
  });

  it("picks every color from the same palette", () => {
    const hues = new Set<string>();

    for (const url of [
      "https://example.com",
      "https://github.com",
      "https://news.ycombinator.com",
      "https://www.bbc.co.uk",
      "https://courses.northfield.edu",
      "http://localhost",
      "http://127.0.0.2",
    ]) {
      const { color } = getLinkPlaceholder({ url });
      expect(color).toMatch(/^oklch\(0\.62 0\.14 \d+\)$/);
      hues.add(color);
    }

    expect(hues.size).toBeGreaterThan(1);
  });

  it("goes by the site alone, not the link's own icon color", () => {
    const site = getLinkPlaceholder({ url: "https://example.com" });

    for (const color of [
      "#f97316",
      "red",
      "#f97316 0%, red) 1px, transparent), url(https://a.example/x) /*",
    ]) {
      const link = {
        url: "https://example.com",
        name: "A",
        icon: "Star",
        color,
      };
      expect(getLinkPlaceholder(link)).toEqual(site);
    }
  });
});
