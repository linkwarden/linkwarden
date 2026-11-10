import { afterEach, describe, expect, it, vi } from "vitest";
import getPublicUser from "./getPublicUser";
import { prisma } from "@linkwarden/prisma";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

describe("getPublicUser", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("looks a user up by username without an email branch by default", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 1,
      username: "alice",
    } as any);

    await getPublicUser("alice", false);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { username: "alice" },
    });
  });

  it("does not look a user up by email when email lookup is not allowed", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null as any);

    await getPublicUser("alice@example.com", false);

    const where = vi.mocked(prisma.user.findFirst).mock.calls[0][0]!.where as any;
    expect(where.OR).toBeUndefined();
    expect(where.email).toBeUndefined();
  });

  it("allows an email lookup only when explicitly permitted", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 1,
      username: "alice",
    } as any);

    await getPublicUser("alice@example.com", false, true);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ username: "alice@example.com" }, { email: "alice@example.com" }],
      },
    });
  });

  it("looks a user up by id regardless of the email flag", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 5,
      username: "bob",
    } as any);

    await getPublicUser("5", true, true);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 5 },
    });
  });
});
