import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import LinkIdHandler from "./[linkId]";
import { prisma } from "@linkwarden/prisma";
import formidable from "formidable";
import fs from "fs";
import { readFile, createFile } from "@linkwarden/filesystem";
import { generatePreview } from "@linkwarden/lib/generatePreview";
import verifyToken from "@/lib/api/verifyToken";
import verifyUser from "@/lib/api/verifyUser";
import getPermission from "@/lib/api/getPermission";

// Mock dependencies
vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    link: {
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    collection: {
      findFirst: vi.fn(),
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
  readFile: vi.fn(),
  createFile: vi.fn(),
  createFolder: vi.fn(),
}));

vi.mock("@linkwarden/lib/generatePreview", () => ({
  generatePreview: vi.fn(),
}));

vi.mock("@/lib/api/verifyToken", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/verifyUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/getPermission", () => ({
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
    if (format === 3) return ".json"; // readability
    if (format === 4) return ".html"; // monolith
    return undefined;
  }),
}));

describe("archives/[linkId] API", () => {
  const originalEnv = process.env;
  let formParseCallback: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };

    // Reset mocks
    const isDemoMode = await import("@/lib/api/isDemoMode");
    vi.mocked(isDemoMode.default).mockReturnValue(false);

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
    res.send = vi.fn().mockReturnValue(res);
    res.setHeader = vi.fn().mockReturnValue(res);
    return res;
  };

  describe("GET requests", () => {
    test("returns 401 for invalid parameters", async () => {
      const req = { method: "GET", query: {} };
      const res = mockRes();

      await LinkIdHandler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        response: "Invalid parameters.",
      });
    });

    test("returns 401 if collection not accessible", async () => {
      const req = {
        method: "GET",
        query: { linkId: "1", format: "3" },
      };
      const res = mockRes();

      vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);
      vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

      await LinkIdHandler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        response: "You don't have access to this collection.",
      });
    });

    test("serves file successfully", async () => {
      const req = {
        method: "GET",
        query: { linkId: "1", format: "3" },
      };
      const res = mockRes();

      vi.mocked(verifyToken).mockResolvedValue({ id: 1 } as any);
      vi.mocked(prisma.collection.findFirst).mockResolvedValue({
        id: 100,
      } as any);
      vi.mocked(readFile).mockResolvedValue({
        file: Buffer.from("data"),
        contentType: "image/png",
        status: 200,
      });

      await LinkIdHandler(req as any, res as any);

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/png");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe("POST requests", () => {
    test("returns 400 in demo mode", async () => {
      const req = { method: "POST" };
      const res = mockRes();

      const isDemoMode = await import("@/lib/api/isDemoMode");
      vi.mocked(isDemoMode.default).mockReturnValue(true);

      await LinkIdHandler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("returns 400 if collection not accessible", async () => {
      const req = {
        method: "POST",
        query: { linkId: "1", format: "3" },
      };
      const res = mockRes();

      vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
      // Simulate no permission
      vi.mocked(getPermission).mockResolvedValue(null);

      await LinkIdHandler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        response: "Collection is not accessible.",
      });
    });

    test("returns 400 if link not found", async () => {
      const req = {
        method: "POST",
        query: { linkId: "1", format: "3" },
      };
      const res = mockRes();

      vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
      vi.mocked(getPermission).mockResolvedValue({
        id: 100,
        ownerId: 1,
        members: [],
      } as any);
      vi.mocked(prisma.link.findUnique).mockResolvedValue(null);

      await LinkIdHandler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ response: "Link not found." });
    });

    test("returns 400 if PNG/JPEG conflict exists", async () => {
      const req = {
        method: "POST",
        query: { linkId: "1", format: "0" }, // 0 is PNG
      };
      const res = mockRes();

      vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
      vi.mocked(getPermission).mockResolvedValue({
        id: 100,
        ownerId: 1,
        members: [],
      } as any);

      // Existing link has JPEG image
      vi.mocked(prisma.link.findUnique).mockResolvedValue({
        id: 1,
        image: "archive/1/1.jpeg", // Ends with jpeg
      } as any);

      // Ensure suffixes match logic
      // link.image ends with jpeg. format is 3 (PNG). Suffix for 3 is .png.
      // Logic: (jpeg && format==PNG) -> Conflict.

      await LinkIdHandler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        response: "PNG or JPEG file already exists.",
      });
    });

    test("returns 400 if link limit exceeded", async () => {
      const req = {
        method: "POST",
        query: { linkId: "1", format: "3" },
      };
      const res = mockRes();

      vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
      vi.mocked(getPermission).mockResolvedValue({
        id: 100,
        ownerId: 1,
        members: [],
      } as any);
      vi.mocked(prisma.link.findUnique).mockResolvedValue({ id: 1 } as any);

      // Mock count to exceed limit
      vi.mocked(prisma.link.count).mockResolvedValue(30001);

      await LinkIdHandler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.stringContaining("maximum"),
        })
      );
    });

    test("returns 400 if formidable errors", async () => {
      const req = {
        method: "POST",
        query: { linkId: "1", format: "3" },
      };
      const res = mockRes();

      vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
      vi.mocked(getPermission).mockResolvedValue({
        id: 100,
        ownerId: 1,
        members: [],
      } as any);
      vi.mocked(prisma.link.findUnique).mockResolvedValue({ id: 1 } as any);
      vi.mocked(prisma.link.count).mockResolvedValue(0);

      // Use default mock which captures callback
      await LinkIdHandler(req as any, res as any);

      // Trigger callback with error
      expect(formParseCallback).toBeDefined();
      await formParseCallback(new Error("Formidable error"), {}, {});

      expect(res.status).toHaveBeenCalledWith(400);
      // Expect the generic error message as per code
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.stringContaining("process your file"),
        })
      );
    });

    test("returns 400 if file missing in request", async () => {
      const req = {
        method: "POST",
        query: { linkId: "1", format: "3" },
      };
      const res = mockRes();

      vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
      vi.mocked(getPermission).mockResolvedValue({
        id: 100,
        ownerId: 1,
        members: [],
      } as any);
      vi.mocked(prisma.link.findUnique).mockResolvedValue({ id: 1 } as any);
      vi.mocked(prisma.link.count).mockResolvedValue(0);

      await LinkIdHandler(req as any, res as any);

      expect(formParseCallback).toBeDefined();
      await formParseCallback(null, {}, {}); // No files

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.stringContaining("couldn't process your file"),
        })
      );
    });

    test("returns 400 if schema validation fails", async () => {
      const req = {
        method: "POST",
        query: { linkId: "1", format: "3" },
      };
      const res = mockRes();

      vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
      vi.mocked(getPermission).mockResolvedValue({
        id: 100,
        ownerId: 1,
        members: [],
      } as any);
      vi.mocked(prisma.link.findUnique).mockResolvedValue({ id: 1 } as any);
      vi.mocked(prisma.link.count).mockResolvedValue(0);

      const mockFiles = {
        file: [
          { filepath: "/tmp/test.png", mimetype: "image/png", size: 999999999 },
        ],
      };

      await LinkIdHandler(req as any, res as any);

      expect(formParseCallback).toBeDefined();
      await formParseCallback(null, { id: 1 }, mockFiles);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ response: expect.stringContaining("Error:") })
      );
    });

    test("returns 400 if file type invalid", async () => {
      const req = {
        method: "POST",
        query: { linkId: "1", format: "3" },
      };
      const res = mockRes();

      vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
      vi.mocked(getPermission).mockResolvedValue({
        id: 100,
        ownerId: 1,
        members: [],
      } as any);
      vi.mocked(prisma.link.findUnique).mockResolvedValue({ id: 1 } as any);
      vi.mocked(prisma.link.count).mockResolvedValue(0);

      const mockFiles = {
        file: [
          {
            filepath: "/tmp/test.exe",
            mimetype: "application/x-msdownload",
            size: 1024,
          },
        ],
      };

      await LinkIdHandler(req as any, res as any);

      expect(formParseCallback).toBeDefined();
      await formParseCallback(null, { id: 1 }, mockFiles);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ response: expect.stringContaining("Error:") })
      );
    });

    test("handles preview mode correctly", async () => {
      const req = {
        method: "POST",
        query: { linkId: "1", format: "3", preview: "true" },
      };
      const res = mockRes();

      vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
      vi.mocked(getPermission).mockResolvedValue({
        id: 100,
        ownerId: 1,
        members: [],
      } as any);
      vi.mocked(prisma.link.findUnique).mockResolvedValue({ id: 1 } as any);
      vi.mocked(prisma.link.count).mockResolvedValue(0);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("file-content"));

      const mockFiles = {
        file: [
          { filepath: "/tmp/update.png", mimetype: "image/png", size: 1024 },
        ],
      };

      vi.mocked(prisma.link.update).mockResolvedValue({ id: 1 } as any);

      await LinkIdHandler(req as any, res as any);

      expect(formParseCallback).toBeDefined();
      await formParseCallback(null, { id: 1 }, mockFiles);

      expect(generatePreview).toHaveBeenCalled();

      expect(createFile).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("handles race condition where link deleted during upload", async () => {
      const req = {
        method: "POST",
        query: { linkId: "1", format: "3" },
      };
      const res = mockRes();

      vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
      vi.mocked(getPermission).mockResolvedValue({
        id: 100,
        ownerId: 1,
        members: [],
      } as any);

      // First findUnique returns link
      vi.mocked(prisma.link.findUnique).mockResolvedValueOnce({ id: 1 } as any);

      vi.mocked(prisma.link.count).mockResolvedValue(0);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("file-content"));

      const mockFiles = {
        file: [
          { filepath: "/tmp/update.png", mimetype: "image/png", size: 1024 },
        ],
      };

      // Second findUnique (inside callback) returns null
      vi.mocked(prisma.link.findUnique).mockResolvedValueOnce(null);

      await LinkIdHandler(req as any, res as any);

      expect(formParseCallback).toBeDefined();
      await formParseCallback(null, { id: 1 }, mockFiles);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ response: "Link not found." });
    });

    test("handles successful file update", async () => {
      const req = {
        method: "POST",
        query: { linkId: "1", format: "3" },
      };
      const res = mockRes();

      vi.mocked(verifyUser).mockResolvedValue({ id: 1 } as any);
      vi.mocked(getPermission).mockResolvedValue({
        id: 100,
        ownerId: 1,
        members: [],
      } as any);
      vi.mocked(prisma.link.findUnique).mockResolvedValue({
        id: 1,
        image: "some-image.png",
      } as any);
      vi.mocked(prisma.link.count).mockResolvedValue(0);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("file-content"));

      const mockFields = { id: 1 }; // id matches schema validation requirement
      const mockFiles = {
        file: [
          { filepath: "/tmp/update.png", mimetype: "image/png", size: 1024 },
        ],
      };

      vi.mocked(prisma.link.update).mockResolvedValue({ id: 1 } as any);

      await LinkIdHandler(req as any, res as any);

      expect(formParseCallback).toBeDefined();
      await formParseCallback(null, mockFields, mockFiles);

      expect(createFile).toHaveBeenCalled();
      expect(prisma.link.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
