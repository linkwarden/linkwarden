import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import Index from "./index";
import { prisma } from "@linkwarden/prisma";
import formidable from "formidable";
import fs from "fs";
import { createFile, createFolder } from "@linkwarden/filesystem";
import { generatePreview } from "@linkwarden/lib/generatePreview";
import verifyUser from "@/lib/api/verifyUser";
import setCollection from "@/lib/api/setCollection";
import fetchTitleAndHeaders from "@/lib/shared/fetchTitleAndHeaders";

// Mock dependencies
vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    link: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("formidable", () => {
  return {
    default: vi.fn(() => ({
      parse: vi.fn(),
    })),
  };
});

vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
}));

vi.mock("@linkwarden/filesystem", () => ({
  createFile: vi.fn(),
  createFolder: vi.fn(),
}));

vi.mock("@linkwarden/lib/generatePreview", () => ({
  generatePreview: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/isDemoMode", () => ({
  default: vi.fn(() => false),
}));

vi.mock("@/lib/shared/getSuffixFromFormat", () => ({
  default: vi.fn((format) => {
    if (format === 0) return ".png";
    if (format === 1) return ".jpeg";
    if (format === 2) return ".pdf";
    if (format === 3) return ".json";
    if (format === 4) return ".html";
    return undefined;
  }),
}));

vi.mock("@/lib/api/setCollection", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/shared/fetchTitleAndHeaders", () => ({
  default: vi.fn(),
}));

describe("archives/index API", () => {
  const originalEnv = process.env;
  let formParseCallback: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };

    // Reset mocks
    const isDemoMode = await import("@/lib/api/isDemoMode");
    vi.mocked(isDemoMode.default).mockReturnValue(false);

    // Reset formParseCallback
    formParseCallback = null;
    vi.mocked(formidable).mockReturnValue({
      parse: (_req: any, cb: any) => {
        formParseCallback = cb;
      },
    } as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns 405 for non-POST requests", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    await Index(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ response: "Method not allowed" });
  });

  test("returns 401 if format is missing", async () => {
    const req = { method: "POST", query: {} };
    const res = mockRes();

    await Index(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ response: "Missing format" });
  });

  test("returns 400 in demo mode", async () => {
    const req = { method: "POST" };
    const res = mockRes();

    const isDemoMode = await import("@/lib/api/isDemoMode");
    vi.mocked(isDemoMode.default).mockReturnValue(true);

    await Index(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      response:
        "This action is disabled because this is a read-only demo of Linkwarden.",
    });
  });

  test("handles successful file upload", async () => {
    const req = {
      method: "POST",
      query: { format: "3" }, // PNG format
    };
    const res = mockRes();

    // Setup mocks
    const mockUser = { id: 1 };
    vi.mocked(verifyUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.link.count).mockResolvedValue(0);
    vi.mocked(setCollection).mockResolvedValue({ id: 100 } as any);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("file-content"));
    vi.mocked(fetchTitleAndHeaders).mockResolvedValue({
      title: "Test Title",
      headers: null,
    });
    vi.mocked(prisma.link.create).mockResolvedValue({ id: 500 } as any);
    vi.mocked(prisma.link.update).mockResolvedValue({
      id: 500,
      updated: true,
    } as any);

    await Index(req as any, res as any);

    // Manually trigger the callback
    const mockFields = { url: "http://linkwarden.app" };
    const mockFiles = {
      file: [
        {
          filepath: "/tmp/test.png",
          mimetype: "image/png",
          size: 1024,
        },
      ],
    };
    expect(formParseCallback).toBeDefined();
    await formParseCallback(null, mockFields, mockFiles);

    expect(prisma.link.create).toHaveBeenCalled();
    expect(createFolder).toHaveBeenCalledWith({
      filePath: "archives/preview/100",
    });
    expect(generatePreview).toHaveBeenCalled();
    expect(createFile).toHaveBeenCalled();
    expect(prisma.link.update).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalledWith("/tmp/test.png");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("returns 400 if link limit exceeded", async () => {
    const req = {
      method: "POST",
      query: { format: "3" },
    };
    const res = mockRes();

    const mockUser = { id: 1 };
    vi.mocked(verifyUser).mockResolvedValue(mockUser as any);
    // Simulate limit exceeded
    vi.mocked(prisma.link.count).mockResolvedValue(30001);

    await Index(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ response: expect.stringContaining("maximum") })
    );
  });

  test("returns 400 if formidable errors", async () => {
    const req = {
      method: "POST",
      query: { format: "3" },
    };
    const res = mockRes();

    vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
    vi.mocked(prisma.link.count).mockResolvedValue(0);

    await Index(req as any, res as any);

    // Trigger callback with error
    expect(formParseCallback).toBeDefined();
    await formParseCallback(new Error("Formidable error"), {}, {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.stringContaining("couldn't process"),
      })
    );
  });
});
