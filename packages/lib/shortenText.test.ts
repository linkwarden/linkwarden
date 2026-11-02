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
});
