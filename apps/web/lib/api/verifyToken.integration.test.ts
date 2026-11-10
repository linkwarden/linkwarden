import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { encode } from "next-auth/jwt";

vi.mock("next-i18next.config", () => ({
  i18n: { locales: ["en"] },
}));

let prisma: typeof import("@linkwarden/prisma").prisma;
let verifyToken: typeof import("./verifyToken").default;
let isAuthenticatedRequest: typeof import("./isAuthenticatedRequest").default;
let updateUserById: typeof import("./controllers/users/userId/updateUserById").default;
let postToken: typeof import("./controllers/tokens/postToken").default;
let createSession: typeof import("./controllers/session/createSession").default;
let deleteToken: typeof import("./controllers/tokens/tokenId/deleteTokenById").default;
let resetPassword: typeof import("@/pages/api/v1/auth/reset-password").default;

const OLD_PASSWORD = "old-password-123";
const NEW_PASSWORD = "new-password-456";

const createdUserIds: number[] = [];

const ensureTestEnv = async () => {
  await import("dotenv/config");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests for verifyToken."
    );
  }

  vi.stubEnv("NODE_ENV", "test");
  process.env.NEXTAUTH_SECRET =
    process.env.NEXTAUTH_SECRET || "verify-token-test-secret";
  process.env.STRIPE_SECRET_KEY = "";
  process.env.NEXT_PUBLIC_DEMO = "false";

  delete process.env.EMAIL_FROM;
  delete process.env.EMAIL_SERVER;
};

const createTestUser = async ({ withPassword = true } = {}) => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      username: `session_test_${suffix}`,
      email: `session_test_${suffix}@example.com`,
      emailVerified: new Date(),
      password: withPassword ? bcrypt.hashSync(OLD_PASSWORD, 10) : undefined,
    },
  });

  createdUserIds.push(user.id);
  return user;
};

const bearer = (token: string) =>
  ({
    headers: { authorization: `Bearer ${token}` },
    cookies: {},
  }) as any;

// What next-auth keeps in the session cookie of a signed in browser
const webSession = async (userId: number, claims = {}) => {
  const cookieName = process.env.NEXTAUTH_URL?.startsWith("https://")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const token = await encode({
    token: { id: userId, sub: userId, ...claims },
    secret: process.env.NEXTAUTH_SECRET as string,
  });

  return { headers: {}, cookies: { [cookieName]: token } } as any;
};

// An API token, an app session (mobile/extension) and a web session cookie
const signInEverywhere = async (userId: number) => {
  const apiToken = await postToken(
    { name: `token_${Math.random().toString(16).slice(2)}`, expires: 0 },
    userId
  );
  const appSession = await createSession(userId, "Phone");

  return {
    apiToken: bearer((apiToken.response as any).secretKey),
    appSession: bearer((appSession.response as any).token),
    webSession: await webSession(userId),
  };
};

const isSignedIn = async (req: any) =>
  typeof (await verifyToken({ req })) !== "string" &&
  !!(await isAuthenticatedRequest({ req }));

const changePassword = (
  user: { id: number; username: string | null; email: string | null },
  oldPassword: string
) =>
  updateUserById(user.id, {
    username: user.username,
    email: user.email,
    oldPassword,
    newPassword: NEW_PASSWORD,
  } as any);

const createMockResponse = () => {
  const state = { statusCode: 200, jsonBody: undefined as any };

  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: any) {
      state.jsonBody = body;
      return res;
    },
  };

  return { res: res as any, state };
};

describe("session revocation", () => {
  beforeAll(async () => {
    await ensureTestEnv();

    ({ prisma } = await import("@linkwarden/prisma"));
    ({ default: verifyToken } = await import("./verifyToken"));
    ({ default: isAuthenticatedRequest } = await import(
      "./isAuthenticatedRequest"
    ));
    ({ default: updateUserById } = await import(
      "./controllers/users/userId/updateUserById"
    ));
    ({ default: postToken } = await import("./controllers/tokens/postToken"));
    ({ default: createSession } = await import(
      "./controllers/session/createSession"
    ));
    ({ default: deleteToken } = await import(
      "./controllers/tokens/tokenId/deleteTokenById"
    ));
    ({ default: resetPassword } = await import(
      "@/pages/api/v1/auth/reset-password"
    ));
  });

  afterAll(async () => {
    if (!prisma) return;

    const users = await prisma.user.findMany({
      where: { id: { in: createdUserIds } },
      select: { email: true },
    });

    await prisma.passwordResetToken.deleteMany({
      where: { identifier: { in: users.map((user) => user.email as string) } },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  });

  it("accepts every kind of session while nothing changed", async () => {
    const user = await createTestUser();
    const sessions = await signInEverywhere(user.id);

    // Updating the profile without touching the password signs no one out
    const updated = await updateUserById(user.id, {
      username: user.username,
      email: user.email,
      name: "Renamed",
    } as any);
    expect(updated.status).toBe(200);

    for (const req of Object.values(sessions))
      expect(await isSignedIn(req)).toBe(true);
  });

  it("revokes API tokens, app sessions and web sessions when the password changes", async () => {
    const user = await createTestUser();
    const sessions = await signInEverywhere(user.id);

    const changed = await changePassword(user, OLD_PASSWORD);
    expect(changed.status).toBe(200);

    expect(await verifyToken({ req: sessions.apiToken })).toBe(
      "Your session has expired, please log in again."
    );
    expect(await isSignedIn(sessions.apiToken)).toBe(false);
    expect(await isSignedIn(sessions.appSession)).toBe(false);
    expect(await isSignedIn(sessions.webSession)).toBe(false);
  });

  it("accepts sessions created after the password change", async () => {
    const user = await createTestUser();

    const changed = await changePassword(user, OLD_PASSWORD);
    expect(changed.status).toBe(200);

    const { sessionVersion } = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const sessions = await signInEverywhere(user.id);

    expect(await isSignedIn(sessions.apiToken)).toBe(true);
    expect(await isSignedIn(sessions.appSession)).toBe(true);
    expect(
      await isSignedIn(
        await webSession(user.id, { sessionId: "after-change", sessionVersion })
      )
    ).toBe(true);
  });

  it("rejects a signed out web session but not the user's other web sessions", async () => {
    const user = await createTestUser();
    const signedOut = await webSession(user.id, {
      sessionId: `signed_out_${user.id}`,
      sessionVersion: 0,
    });
    const other = await webSession(user.id, {
      sessionId: `other_${user.id}`,
      sessionVersion: 0,
    });

    // What signing out of the web leaves behind
    await prisma.accessToken.create({
      data: {
        name: "Web Session",
        userId: user.id,
        token: `signed_out_${user.id}`,
        isSession: true,
        revoked: true,
        expires: new Date(Date.now() + 1000 * 60),
      },
    });

    expect(await isSignedIn(signedOut)).toBe(false);
    expect(await isSignedIn(other)).toBe(true);
  });

  it("keeps every session when the old password is wrong", async () => {
    const user = await createTestUser();
    const sessions = await signInEverywhere(user.id);

    const changed = await changePassword(user, "wrong-password-789");
    expect(changed.status).toBe(400);

    for (const req of Object.values(sessions))
      expect(await isSignedIn(req)).toBe(true);
  });

  it("leaves other users signed in when one user changes their password", async () => {
    const user = await createTestUser();
    const otherUser = await createTestUser();
    const otherSessions = await signInEverywhere(otherUser.id);

    const changed = await changePassword(user, OLD_PASSWORD);
    expect(changed.status).toBe(200);

    for (const req of Object.values(otherSessions))
      expect(await isSignedIn(req)).toBe(true);
  });

  it("keeps an SSO user signed in when they create their first password", async () => {
    const user = await createTestUser({ withPassword: false });
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "oauth",
        provider: "github",
        providerAccountId: `session_test_${user.id}`,
      },
    });
    const sessions = await signInEverywhere(user.id);

    const created = await updateUserById(user.id, {
      username: user.username,
      email: user.email,
      newPassword: NEW_PASSWORD,
    } as any);
    expect(created.status).toBe(200);

    for (const req of Object.values(sessions))
      expect(await isSignedIn(req)).toBe(true);
  });

  it("revokes every session when the password is reset", async () => {
    const user = await createTestUser();
    const sessions = await signInEverywhere(user.id);

    const resetToken = `session_test_reset_${user.id}`;
    await prisma.passwordResetToken.create({
      data: {
        identifier: user.email as string,
        token: resetToken,
        expires: new Date(Date.now() + 1000 * 60 * 10),
      },
    });

    const { res, state } = createMockResponse();
    await resetPassword(
      {
        method: "POST",
        body: { token: resetToken, password: NEW_PASSWORD },
      } as any,
      res
    );
    expect(state.statusCode).toBe(200);

    for (const req of Object.values(sessions))
      expect(await isSignedIn(req)).toBe(false);
  });

  it("revokes only the deleted token", async () => {
    const user = await createTestUser();
    const sessions = await signInEverywhere(user.id);

    const [token] = await prisma.accessToken.findMany({
      where: { userId: user.id, isSession: false },
    });
    const deleted = await deleteToken(user.id, token.id);
    expect(deleted.status).toBe(200);

    expect(await isSignedIn(sessions.apiToken)).toBe(false);
    expect(await isSignedIn(sessions.appSession)).toBe(true);
    expect(await isSignedIn(sessions.webSession)).toBe(true);
  });
});
