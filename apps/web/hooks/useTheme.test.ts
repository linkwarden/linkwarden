import { describe, expect, it } from "vitest";
import { resolveDisplayTheme } from "./useTheme";

describe("resolveDisplayTheme", () => {
  it("follows the system theme for visitors who are not logged in", () => {
    expect(resolveDisplayTheme("unauthenticated", undefined, "light")).toBe(
      "light"
    );
    expect(resolveDisplayTheme("unauthenticated", undefined, "dark")).toBe(
      "dark"
    );
  });

  it("uses the stored theme of a logged-in user", () => {
    expect(resolveDisplayTheme("authenticated", "dark", "light")).toBe("dark");
    expect(resolveDisplayTheme("authenticated", "light", "dark")).toBe(
      "light"
    );
  });

  it("follows the system theme when the user chose auto", () => {
    expect(resolveDisplayTheme("authenticated", "auto", "light")).toBe(
      "light"
    );
  });

  it("leaves the theme untouched while the session is still loading", () => {
    expect(resolveDisplayTheme("loading", undefined, "light")).toBeUndefined();
  });

  it("leaves the theme untouched until the user data has loaded", () => {
    expect(
      resolveDisplayTheme("authenticated", undefined, "light")
    ).toBeUndefined();
  });
});
