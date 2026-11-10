import { afterEach, describe, expect, it, vi } from "vitest";
import { getImportLimitMb } from "./index";

describe("getImportLimitMb", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps a fractional megabyte limit", () => {
    vi.stubEnv("IMPORT_LIMIT", "0.002");

    expect(getImportLimitMb()).toBe(0.002);
  });

  it("reads a whole megabyte limit", () => {
    vi.stubEnv("IMPORT_LIMIT", "25");

    expect(getImportLimitMb()).toBe(25);
  });

  it("defaults to 10 when unset", () => {
    vi.stubEnv("IMPORT_LIMIT", "");

    expect(getImportLimitMb()).toBe(10);
  });

  it("defaults to 10 when the value is not a number", () => {
    vi.stubEnv("IMPORT_LIMIT", "ten");

    expect(getImportLimitMb()).toBe(10);
  });
});
