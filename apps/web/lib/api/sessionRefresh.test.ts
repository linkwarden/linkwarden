import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { encode, decode, JWT } from "next-auth/jwt";
import { prisma } from "@linkwarden/prisma";

// What the web app's session refresh (GET /api/v1/auth/session, which every
// page load makes) does with the session cookie, without a database.

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    accessToken: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const SECRET = "session-refresh-test-secret";
const COOKIE = "next-auth.session-token";

let auth: typeof import("@/pages/api/v1/auth/[...nextauth]").default;

const sessionCookie = (claims: Record<string, unknown>) =>
  encode({
    token: { id: 7, sub: 7, name: null, email: null, ...claims } as JWT,
    secret: SECRET,
  });

// Calls the NextAuth route the way Next.js would and collects the response
const refresh = async (cookie: string) => {
  const headers: Record<string, any> = {};
  const state = { status: 200, body: undefined as any };

  const res: any = {
    status(code: number) {
      state.status = code;
      return res;
    },
    getHeader: (name: string) => headers[name.toLowerCase()],
    setHeader(name: string, value: any) {
      headers[name.toLowerCase()] = value;
      return res;
    },
    send(body: any) {
      state.body = typeof body === "string" ? JSON.parse(body) : body;
      return res;
    },
    json(body: any) {
      state.body = body;
      return res;
    },
    end: () => res,
  };

  await auth(
    {
      method: "GET",
      query: { nextauth: ["session"] },
      headers: { host: "127.0.0.1:3000" },
      cookies: { [COOKIE]: cookie },
      body: undefined,
    } as any,
    res
  );

  const setCookies: string[] = [].concat(headers["set-cookie"] ?? []);
  const value = setCookies
    .find((header) => header.startsWith(`${COOKIE}=`))
    ?.split(";")[0]
    .slice(COOKIE.length + 1);

  return { ...state, sessionCookie: value };
};

const databaseDown = () => {
  const error = Object.assign(
    new Error("Can't reach database server at `127.0.0.1:5432`"),
    { code: "P1001" }
  );
  vi.mocked(prisma.accessToken.findUnique).mockRejectedValue(error);
  vi.mocked(prisma.user.findUnique).mockRejectedValue(error);
};

describe("web session refresh", () => {
  beforeAll(async () => {
    vi.stubEnv("NEXTAUTH_SECRET", SECRET);
    vi.stubEnv("NEXTAUTH_URL", "http://127.0.0.1:3000/api/v1/auth");
    vi.stubEnv("STRIPE_SECRET_KEY", "");

    auth = (await import("@/pages/api/v1/auth/[...nextauth]")).default;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("refreshes a valid session and keeps its cookie", async () => {
    vi.mocked(prisma.accessToken.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      sessionVersion: 0,
    } as any);

    const refreshed = await refresh(await sessionCookie({}));

    expect(refreshed.body?.user?.id).toBe(7);
    expect(refreshed.sessionCookie).toBeTruthy();
  });

  // A database restart or a full connection pool shouldn't sign everyone out
  // who happens to load a page meanwhile. API requests fail on their own
  // while the database is down, and still check for revocation once it's back.
  it("keeps the user signed in when the database can't be reached", async () => {
    databaseDown();

    const refreshed = await refresh(
      await sessionCookie({ sessionId: "session-1", sessionVersion: 0 })
    );

    expect(refreshed.body?.user?.id).toBe(7);
    expect(refreshed.sessionCookie).toBeTruthy();
  });

  it("signs out a session whose password was changed", async () => {
    vi.mocked(prisma.accessToken.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      sessionVersion: 1,
    } as any);

    const refreshed = await refresh(
      await sessionCookie({ sessionId: "session-1", sessionVersion: 0 })
    );

    expect(refreshed.body?.user).toBeUndefined();
    expect(refreshed.sessionCookie).toBe("");
  });

  it("signs out a session that was signed out elsewhere", async () => {
    vi.mocked(prisma.accessToken.findUnique).mockResolvedValue({
      revoked: true,
    } as any);

    const refreshed = await refresh(
      await sessionCookie({ sessionId: "session-1", sessionVersion: 0 })
    );

    expect(refreshed.body?.user).toBeUndefined();
    expect(refreshed.sessionCookie).toBe("");
  });

  it("gives a session from before session IDs one that then stays the same", async () => {
    vi.mocked(prisma.accessToken.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      sessionVersion: 0,
    } as any);

    const first = await refresh(await sessionCookie({}));
    const firstToken = await decode({
      token: first.sessionCookie,
      secret: SECRET,
    });
    expect(firstToken?.sessionId).toEqual(expect.any(String));

    const second = await refresh(first.sessionCookie as string);
    const secondToken = await decode({
      token: second.sessionCookie,
      secret: SECRET,
    });
    expect(secondToken?.sessionId).toBe(firstToken?.sessionId);
    expect(secondToken?.jti).not.toBe(firstToken?.jti);
  });
});
