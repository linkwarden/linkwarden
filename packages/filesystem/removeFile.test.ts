import fs from "fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { removeFile } from "./removeFile";

vi.mock("./s3Client", () => ({
  default: undefined,
}));

describe("removeFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("ignores missing local files", async () => {
    const unlinkMock = vi
      .spyOn(fs, "unlink")
      .mockImplementation((_path, callback) => {
        callback(Object.assign(new Error("missing"), { code: "ENOENT" }));
        return undefined as any;
      });
    const logMock = vi.spyOn(console, "log").mockImplementation(() => {});

    await removeFile({ filePath: "archives/1/2.jpg" });

    expect(unlinkMock).toHaveBeenCalledOnce();
    expect(logMock).not.toHaveBeenCalled();
  });

  it("logs unexpected local unlink errors", async () => {
    vi.spyOn(fs, "unlink").mockImplementation((_path, callback) => {
      callback(Object.assign(new Error("permission denied"), { code: "EACCES" }));
      return undefined as any;
    });
    const logMock = vi.spyOn(console, "log").mockImplementation(() => {});

    await removeFile({ filePath: "archives/1/2.jpg" });

    expect(logMock).toHaveBeenCalledOnce();
  });
});
