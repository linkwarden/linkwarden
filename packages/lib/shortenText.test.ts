import { describe, expect, it } from "vitest";
import { shortenText } from "./shortenText";

describe("shortenText", () => {
  it("cuts text like slice does", () => {
    expect(shortenText("abcdef", 3)).toBe("abc");
    expect(shortenText("abc", 3)).toBe("abc");
    expect(shortenText("ab", 3)).toBe("ab");
    expect(shortenText("", 3)).toBe("");
    expect(shortenText("abc", 0)).toBe("");
  });

  it("leaves out an emoji the cut would split", () => {
    // "😀" is two UTF-16 units
    expect(shortenText("ab😀cd", 3)).toBe("ab");
    expect(shortenText("😀😀😀", 3)).toBe("😀");
    expect(shortenText("😀", 1)).toBe("");
  });

  it("keeps an emoji that ends where the cut is", () => {
    expect(shortenText("ab😀cd", 4)).toBe("ab😀");
    expect(shortenText("😀😀😀", 4)).toBe("😀😀");
  });

  it("only cuts between characters, so what's left is valid text", () => {
    const text = "a😀b🎉👍🏽c✨d";

    for (let length = 0; length <= text.length + 1; length++) {
      const shortened = shortenText(text, length);

      expect(shortened.length).toBeLessThanOrEqual(length);
      expect(text.startsWith(shortened)).toBe(true);
      // Throws on half a pair
      expect(() => encodeURIComponent(shortened)).not.toThrow();
    }
  });

  it("gives nothing back for no text", () => {
    expect(shortenText(undefined, 3)).toBeUndefined();
    expect(shortenText(null, 3)).toBeUndefined();
  });

  // Mixed text cut at every length: the result is what slice gives, or one unit
  // shorter when slice would end on the first half of a pair, and it's always
  // valid text, so the database takes it
  it("cuts any text no shorter than it must, into valid text", () => {
    const pieces = [
      "a",
      "Z",
      " ",
      "é",
      "日",
      "😀",
      "👍🏽",
      "🇨🇦",
      "👨‍👩‍👧",
      "𝔸",
      "e\u0301",
    ];
    // A fixed seed, so a failure can be run again
    let seed = 42;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };

    for (let run = 0; run < 200; run++) {
      const text = Array.from(
        { length: Math.floor(random() * 20) },
        () => pieces[Math.floor(random() * pieces.length)]
      ).join("");

      for (let length = 0; length <= text.length + 1; length++) {
        const sliced = text.slice(0, length);
        const shortened = shortenText(text, length);
        const splitsAPair = /[\ud800-\udbff]$/.test(sliced);

        expect(shortened).toBe(splitsAPair ? sliced.slice(0, -1) : sliced);
        expect(shortened.isWellFormed()).toBe(true);
      }
    }
  });

  it("leaves out half a pair that the text already ends in", () => {
    // As text from an app that cut it with slice
    expect(shortenText("Half \ud83d", 254)).toBe("Half ");
  });

  it("cuts like slice for lengths slice reads from the end or as zero", () => {
    expect(shortenText("abcdef", -2)).toBe("abcd");
    expect(shortenText("ab😀", -1)).toBe("ab");
    expect(shortenText("abc", NaN)).toBe("");
    expect(shortenText("ab😀", Infinity)).toBe("ab😀");
  });
});
