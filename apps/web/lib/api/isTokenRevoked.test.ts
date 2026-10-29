import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@linkwarden/prisma";
import isTokenRevoked from "./isTokenRevoked";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    accessToken: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const storedToken = (revoked: boolean) =>
  ({ id: 1, userId: 7, token: "stored", revoked, isSession: true }) as any;

const jwt = (claims: Record<string, unknown>) =>
  ({ id: 7, jti: "jti-1", iat: 0, exp: 0, ...claims }) as any;

const userAt = (sessionVersion: number) =>
  vi
    .mocked(prisma.user.findUnique)
    .mockResolvedValue({ sessionVersion } as any);

describe("isTokenRevoked", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("goes by the stored row for access tokens and app sessions", async () => {
    vi.mocked(prisma.accessToken.findUnique).mockResolvedValueOnce(
      storedToken(false)
    );
    expect(await isTokenRevoked(jwt({}))).toBe(false);

    vi.mocked(prisma.accessToken.findUnique).mockResolvedValueOnce(
      storedToken(true)
    );
    expect(await isTokenRevoked(jwt({}))).toBe(true);

    expect(prisma.accessToken.findUnique).toHaveBeenCalledWith({
      where: { token: "jti-1" },
    });
  });

  it("accepts an access token created after a password change", async () => {
    // Its JWT has no sessionVersion, but the stored row decides
    vi.mocked(prisma.accessToken.findUnique).mockResolvedValue(
      storedToken(false)
    );
    userAt(3);

    expect(await isTokenRevoked(jwt({}))).toBe(false);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("looks a web session up by its session ID, not the jti that changes on every refresh", async () => {
    vi.mocked(prisma.accessToken.findUnique).mockResolvedValue(
      storedToken(true)
    );

    expect(await isTokenRevoked(jwt({ sessionId: "session-1" }))).toBe(true);
    expect(prisma.accessToken.findUnique).toHaveBeenCalledWith({
      where: { token: "session-1" },
    });
  });

  it("compares a web session's version with the user's", async () => {
    vi.mocked(prisma.accessToken.findUnique).mockResolvedValue(null);

    userAt(2);
    expect(
      await isTokenRevoked(jwt({ sessionId: "s", sessionVersion: 2 }))
    ).toBe(false);
    expect(
      await isTokenRevoked(jwt({ sessionId: "s", sessionVersion: 1 }))
    ).toBe(true);
  });

  it("treats a session from before session versions as version 0", async () => {
    vi.mocked(prisma.accessToken.findUnique).mockResolvedValue(null);

    userAt(0);
    expect(await isTokenRevoked(jwt({}))).toBe(false);

    userAt(1);
    expect(await isTokenRevoked(jwt({}))).toBe(true);
  });

  it("rejects a token without a stored row once the user has changed their password", async () => {
    // e.g. a JWT whose access token row was deleted from the database
    vi.mocked(prisma.accessToken.findUnique).mockResolvedValue(null);
    userAt(1);

    expect(await isTokenRevoked(jwt({ jti: "unknown" }))).toBe(true);
  });

  it("leaves a deleted user's token to the caller's user lookup", async () => {
    vi.mocked(prisma.accessToken.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    expect(await isTokenRevoked(jwt({ sessionId: "s" }))).toBe(false);
  });

  it("lets database errors through, so API routes fail closed", async () => {
    vi.mocked(prisma.accessToken.findUnique).mockRejectedValue(
      new Error("Can't reach database server")
    );

    await expect(isTokenRevoked(jwt({}))).rejects.toThrow(
      "Can't reach database server"
    );
  });
});
