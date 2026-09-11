import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@linkwarden/prisma";
import { removeFile } from "@linkwarden/filesystem";
import updateUserById from "./updateUserById";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@linkwarden/filesystem", () => ({
  createFile: vi.fn(),
  createFolder: vi.fn(),
  removeFile: vi.fn(),
}));

vi.mock("@/lib/api/sendChangeEmailVerificationRequest", () => ({
  default: vi.fn(),
}));

const existingUser = {
  id: 1,
  name: "Olli",
  username: "olli",
  email: "olli@example.com",
  password: "$2b$10$notarealhash",
  image: "uploads/avatar/1.jpg",
  locale: "de",
  parentSubscriptionId: null,
  referredBy: null,
  accounts: [],
};

const updatePayload = () =>
  (vi.mocked(prisma.user.update).mock.calls[0][0] as any).data;

describe("updateUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.user.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);
    vi.mocked(prisma.user.update).mockImplementation((async ({ data }: any) => {
      const written = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      );

      return { ...existingUser, ...written };
    }) as any);
  });

  it("keeps the avatar and locale when the request doesn't carry them", async () => {
    const { response, status } = (await updateUserById(1, {
      username: "olli",
      email: "olli@example.com",
      archiveAsScreenshot: true,
    } as any)) as any;

    expect(status).toBe(200);
    expect(updatePayload().archiveAsScreenshot).toBe(true);
    expect(updatePayload().image).toBeUndefined();
    expect(updatePayload().locale).toBeUndefined();
    expect(removeFile).not.toHaveBeenCalled();
    expect(response.image).toMatch(/^uploads\/avatar\/1\.jpg\?/);
    expect(response.locale).toBe("de");
  });

  it("removes the avatar when an empty image is sent", async () => {
    const { status } = (await updateUserById(1, {
      username: "olli",
      email: "olli@example.com",
      image: "",
    } as any)) as any;

    expect(status).toBe(200);
    expect(updatePayload().image).toBe("");
    expect(removeFile).toHaveBeenCalledWith({
      filePath: "uploads/avatar/1.jpg",
    });
  });

  it("falls back to en when an unsupported locale is sent", async () => {
    const { status } = (await updateUserById(1, {
      username: "olli",
      email: "olli@example.com",
      locale: "xx",
    } as any)) as any;

    expect(status).toBe(200);
    expect(updatePayload().locale).toBe("en");
  });
});
