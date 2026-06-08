// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  copyTextToClipboard,
  fallbackCopyTextToClipboard,
} from "./copyToClipboard";

function mockExecCommand(result: boolean) {
  const execCommand = vi.fn().mockReturnValue(result);
  Object.defineProperty(document, "execCommand", {
    configurable: true,
    value: execCommand,
  });

  return execCommand;
}

describe("copyToClipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the Clipboard API when it is available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await expect(copyTextToClipboard("token-secret")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("token-secret");
  });

  it("falls back to execCommand when the Clipboard API write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("blocked"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const execCommand = mockExecCommand(true);

    await expect(copyTextToClipboard("token-secret")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("token-secret");
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("returns false when both clipboard mechanisms are unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    const execCommand = mockExecCommand(false);

    await expect(copyTextToClipboard("token-secret")).resolves.toBe(false);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("cleans up the temporary textarea used by the fallback", () => {
    const execCommand = mockExecCommand(true);

    expect(fallbackCopyTextToClipboard("token-secret")).toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });
});
