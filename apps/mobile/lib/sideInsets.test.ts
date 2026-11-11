import { beforeEach, describe, expect, it, vi } from "vitest";

const { useSafeAreaInsets } = vi.hoisted(() => ({
  useSafeAreaInsets: vi.fn(),
}));

vi.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets }));
vi.mock("react", () => ({
  useMemo: (factory: () => unknown) => factory(),
}));

import { useSideInsets } from "./sideInsets";

beforeEach(() => {
  useSafeAreaInsets.mockReset();
});

describe("side insets", () => {
  it("adds no padding on a regular phone held upright", () => {
    useSafeAreaInsets.mockReturnValue({
      top: 62,
      right: 0,
      bottom: 34,
      left: 0,
    });

    expect(useSideInsets()).toEqual({ paddingLeft: 0, paddingRight: 0 });
  });

  it("pads only the side the unfolded iPhone Duo's tab bar is on", () => {
    useSafeAreaInsets.mockReturnValue({
      top: 0,
      right: 84,
      bottom: 34,
      left: 0,
    });

    expect(useSideInsets()).toEqual({ paddingLeft: 0, paddingRight: 84 });
  });

  it("follows the tab bar when it moves to the left edge", () => {
    useSafeAreaInsets.mockReturnValue({
      top: 0,
      right: 0,
      bottom: 34,
      left: 84,
    });

    expect(useSideInsets()).toEqual({ paddingLeft: 84, paddingRight: 0 });
  });

  it("keeps the two sides independent when both are inset", () => {
    useSafeAreaInsets.mockReturnValue({
      top: 0,
      right: 21,
      bottom: 21,
      left: 59,
    });

    expect(useSideInsets()).toEqual({ paddingLeft: 59, paddingRight: 21 });
  });

  it("leaves the top and bottom insets to the screen itself", () => {
    useSafeAreaInsets.mockReturnValue({
      top: 62,
      right: 0,
      bottom: 34,
      left: 0,
    });

    expect(Object.keys(useSideInsets()).sort()).toEqual([
      "paddingLeft",
      "paddingRight",
    ]);
  });
});
