// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "./copyTextToClipboard";

const originalExecCommand = document.execCommand;

const setClipboard = (clipboard: Clipboard | undefined) => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: clipboard,
  });
};

const setExecCommand = (result: boolean) => {
  const execCommand = vi.fn().mockReturnValue(result);

  Object.defineProperty(document, "execCommand", {
    configurable: true,
    value: execCommand,
  });

  return execCommand;
};

describe("copyTextToClipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    setClipboard(undefined);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: originalExecCommand,
    });
  });

  it("uses the Clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText } as unknown as Clipboard);
    const execCommand = setExecCommand(true);

    await expect(copyTextToClipboard("access-token")).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledWith("access-token");
    expect(execCommand).not.toHaveBeenCalled();
  });

  it("falls back to a temporary textarea when Clipboard API writes fail", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("blocked"));
    setClipboard({ writeText } as unknown as Clipboard);
    const execCommand = setExecCommand(true);

    await expect(copyTextToClipboard("secret-token")).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledWith("secret-token");
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("falls back when Clipboard API is unavailable", async () => {
    const execCommand = setExecCommand(true);

    await expect(copyTextToClipboard("plain-token")).resolves.toBe(true);

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });
});
