import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { decode, encode, JWT } from "next-auth/jwt";

// Signing out and changing the password through the real API routes, against
// a real database (DATABASE_URL).

vi.mock("next-i18next.config", () => ({
  i18n: { locales: ["en"] },
}));

const SECRET = "session-routes-integration-secret";
const COOKIE = "next-auth.session-token";
const PASSWORD = "old-password-123";
const NEW_PASSWORD = "new-password-456";

let prisma: typeof import("@linkwarden/prisma").prisma;
let sessionRoute: typeof import("@/pages/api/v1/session").default;
let userRoute: typeof import("@/pages/api/v1/users/[id]").default;
let meRoute: typeof import("@/pages/api/v1/users/me").default;
let authRoute: typeof import("@/pages/api/v1/auth/[...nextauth]").default;
let createSession: typeof import("./controllers/session/createSession").default;
let postToken: typeof import("./controllers/tokens/postToken").default;

const createdUserIds: number[] = [];

type Request = {
  method?: string;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: unknown;
};

// Calls a route the way Next.js would and collects the response
const call = async (handler: any, request: Request = {}) => {
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
    json(body: any) {
      state.body = body;
      return res;
    },
    send(body: any) {
      state.body = body;
      return res;
    },
    end: () => res,
  };

  await handler(
    {
      method: "GET",
      query: {},
      headers: {},
      cookies: {},
      ...request,
    },
    res
  );

  const setCookies: string[] = [].concat(headers["set-cookie"] ?? []);
  return { ...state, setCookies };
};

const cookieValue = (setCookies: string[], name = COOKIE) =>
  setCookies
    .find((header) => header.startsWith(`${name}=`))
    ?.split(";")[0]
    .slice(name.length + 1);

const bearer = (token: string): Request => ({
  headers: { authorization: `Bearer ${token}` },
});
const withCookie = (value: string): Request => ({
  cookies: { [COOKIE]: value },
});

// next-auth splits a session cookie over 3933 characters into
// next-auth.session-token.0, .1, ... (see next-auth/core/lib/cookie)
const chunked = (value: string) =>
  Object.fromEntries(
    (value.match(/.{1,3933}/g) as string[]).map((chunk, i) => [
      `${COOKIE}.${i}`,
      chunk,
    ])
  );

// Applies Set-Cookie headers the way a browser does: Max-Age=0 deletes a
// cookie, and one whose name and value are over 4096 bytes is ignored
const applySetCookies = (jar: Record<string, string>, setCookies: string[]) => {
  const next = { ...jar };

  for (const header of setCookies) {
    const [pair, ...attributes] = header.split("; ");
    const name = pair.slice(0, pair.indexOf("="));
    const value = pair.slice(pair.indexOf("=") + 1);

    if (attributes.some((attribute) => /^max-age=0$/i.test(attribute)))
      delete next[name];
    else if (name.length + value.length <= 4096) next[name] = value;
  }

  return next;
};

const createUser = async ({ withPassword = true } = {}) => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      username: `session_routes_${suffix}`,
      email: `session_routes_${suffix}@example.com`,
      emailVerified: new Date(),
      password: withPassword ? bcrypt.hashSync(PASSWORD, 4) : undefined,
    },
  });

  createdUserIds.push(user.id);
  return user;
};

// The cookie next-auth gives a browser that signed in
const webSession = (userId: number, sessionVersion = 0) =>
  encode({
    token: {
      id: userId,
      sub: userId,
      sessionId: crypto.randomUUID(),
      sessionVersion,
    } as JWT,
    secret: SECRET,
  });

const appSession = async (userId: number, name = "Phone") =>
  ((await createSession(userId, name)).response as { token: string }).token;

const apiKey = async (userId: number) =>
  (
    (
      await postToken(
        { name: `key_${Math.random().toString(16).slice(2)}`, expires: 4 },
        userId
      )
    ).response as { secretKey: string }
  ).secretKey;

const isSignedIn = async (request: Request) =>
  (await call(meRoute, request)).status === 200;

const changePassword = (
  user: { id: number; username: string | null; email: string | null },
  request: Request,
  oldPassword = PASSWORD
) =>
  call(userRoute, {
    ...request,
    method: "PUT",
    query: { id: String(user.id) },
    body: {
      username: user.username,
      email: user.email,
      oldPassword,
      newPassword: NEW_PASSWORD,
    },
  });

// What the browser sends to sign out: the session cookie plus a CSRF token
const signOutOfWeb = (sessionCookie: string) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .createHash("sha256")
    .update(`${csrfToken}${SECRET}`)
    .digest("hex");

  return call(authRoute, {
    method: "POST",
    query: { nextauth: ["signout"] },
    headers: { host: "127.0.0.1:3000" },
    cookies: {
      [COOKIE]: sessionCookie,
      "next-auth.csrf-token": `${csrfToken}|${hash}`,
    },
    body: { csrfToken, callbackUrl: "/", json: "true" },
  });
};

const refreshWebSession = (sessionCookie: string) =>
  call(authRoute, {
    query: { nextauth: ["session"] },
    headers: { host: "127.0.0.1:3000" },
    cookies: { [COOKIE]: sessionCookie },
  });

describe.skipIf(!process.env.DATABASE_URL)(
  "session routes with a real database",
  () => {
    beforeAll(async () => {
      // Read when the routes load
      vi.stubEnv("NEXTAUTH_SECRET", SECRET);
      vi.stubEnv("NEXTAUTH_URL", "http://127.0.0.1:3000/api/v1/auth");
      vi.stubEnv("STRIPE_SECRET_KEY", "");
      vi.stubEnv("NEXT_PUBLIC_DEMO", "false");
      vi.stubEnv("EMAIL_FROM", "");
      vi.stubEnv("EMAIL_SERVER", "");

      prisma = (await import("@linkwarden/prisma")).prisma;
      sessionRoute = (await import("@/pages/api/v1/session")).default;
      userRoute = (await import("@/pages/api/v1/users/[id]")).default;
      meRoute = (await import("@/pages/api/v1/users/me")).default;
      authRoute = (await import("@/pages/api/v1/auth/[...nextauth]")).default;
      createSession = (await import("./controllers/session/createSession"))
        .default;
      postToken = (await import("./controllers/tokens/postToken")).default;
    });

    afterAll(async () => {
      if (!prisma) return;

      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      await prisma.$disconnect();
      vi.unstubAllEnvs();
    });

    describe("DELETE /api/v1/session", () => {
      it("revokes the app session it's called with and nothing else", async () => {
        const user = await createUser();
        const otherUser = await createUser();
        const phone = await appSession(user.id, "Phone");
        const tablet = await appSession(user.id, "Tablet");
        const key = await apiKey(user.id);
        const browser = await webSession(user.id);
        const otherPhone = await appSession(otherUser.id);

        const signedOut = await call(sessionRoute, {
          ...bearer(phone),
          method: "DELETE",
        });
        expect(signedOut.status).toBe(200);

        expect(await isSignedIn(bearer(phone))).toBe(false);
        expect(await isSignedIn(bearer(tablet))).toBe(true);
        expect(await isSignedIn(bearer(key))).toBe(true);
        expect(await isSignedIn(withCookie(browser))).toBe(true);
        expect(await isSignedIn(bearer(otherPhone))).toBe(true);

        const again = await call(sessionRoute, {
          ...bearer(phone),
          method: "DELETE",
        });
        expect(again.status).toBe(401);
      });

      it("leaves an API key working when a client signs out with one", async () => {
        const user = await createUser();
        const key = await apiKey(user.id);

        const signedOut = await call(sessionRoute, {
          ...bearer(key),
          method: "DELETE",
        });

        expect(signedOut.status).toBe(404);
        expect(await isSignedIn(bearer(key))).toBe(true);
      });

      it("leaves a web session alone", async () => {
        const user = await createUser();
        const browser = await webSession(user.id);

        const signedOut = await call(sessionRoute, {
          ...withCookie(browser),
          method: "DELETE",
        });

        expect(signedOut.status).toBe(404);
        expect(await isSignedIn(withCookie(browser))).toBe(true);
      });

      it("needs a session", async () => {
        const signedOut = await call(sessionRoute, { method: "DELETE" });

        expect(signedOut.status).toBe(401);
      });

      it("works when logging in with credentials is disabled", async () => {
        const user = await createUser();
        const phone = await appSession(user.id);

        vi.stubEnv("NEXT_PUBLIC_CREDENTIALS_ENABLED", "false");
        try {
          const signedOut = await call(sessionRoute, {
            ...bearer(phone),
            method: "DELETE",
          });
          expect(signedOut.status).toBe(200);

          const login = await call(sessionRoute, {
            method: "POST",
            body: { username: user.username, password: PASSWORD },
          });
          expect(login.status).toBe(400);
        } finally {
          vi.stubEnv("NEXT_PUBLIC_CREDENTIALS_ENABLED", "true");
        }

        expect(await isSignedIn(bearer(phone))).toBe(false);
      });
    });

    describe("PUT /api/v1/users/:id with a new password", () => {
      it("gives the browser that changed it a new cookie and rejects copies of the old one", async () => {
        const user = await createUser();
        const browser = await webSession(user.id);

        const changed = await changePassword(user, withCookie(browser));
        expect(changed.status).toBe(200);

        const replacement = cookieValue(changed.setCookies) as string;
        expect(replacement).toBeTruthy();

        const [before, after] = await Promise.all([
          decode({ token: browser, secret: SECRET }),
          decode({ token: replacement, secret: SECRET }),
        ]);
        expect(after?.sessionId).toBe(before?.sessionId);
        expect(after?.sessionVersion).toBe(1);
        expect(after?.id).toBe(user.id);

        expect(await isSignedIn(withCookie(replacement))).toBe(true);
        expect(await isSignedIn(withCookie(browser))).toBe(false);

        // And the refreshed cookie keeps working through next-auth too
        const refreshed = await refreshWebSession(replacement);
        expect(refreshed.body?.user?.id).toBe(user.id);
      });

      // Azure AD puts the profile photo in the session as a data URL, which
      // can make the cookie big enough for next-auth to split it
      it("keeps a browser signed in when its session cookie is split into chunks", async () => {
        const user = await createUser();
        const browser = await encode({
          token: {
            id: user.id,
            sub: user.id,
            picture: `data:image/jpeg;base64, ${"A".repeat(3000)}`,
            sessionId: crypto.randomUUID(),
            sessionVersion: 0,
          } as JWT,
          secret: SECRET,
        });
        const jar = chunked(browser);
        expect(Object.keys(jar)).toHaveLength(2);
        expect(await isSignedIn({ cookies: jar })).toBe(true);

        const changed = await changePassword(user, { cookies: jar });
        expect(changed.status).toBe(200);

        const nextJar = applySetCookies(jar, changed.setCookies);
        expect(await isSignedIn({ cookies: nextJar })).toBe(true);
      });

      it("signs no one out when the old password is wrong", async () => {
        const user = await createUser();
        const browser = await webSession(user.id);
        const phone = await appSession(user.id);
        const key = await apiKey(user.id);

        const changed = await changePassword(
          user,
          withCookie(browser),
          "wrong-password-789"
        );
        expect(changed.status).toBe(400);
        expect(cookieValue(changed.setCookies)).toBeUndefined();

        expect(await isSignedIn(withCookie(browser))).toBe(true);
        expect(await isSignedIn(bearer(phone))).toBe(true);
        expect(await isSignedIn(bearer(key))).toBe(true);
      });

      it("leaves the cookie alone on a profile update", async () => {
        const user = await createUser();
        const browser = await webSession(user.id);

        const updated = await call(userRoute, {
          ...withCookie(browser),
          method: "PUT",
          query: { id: String(user.id) },
          body: { username: user.username, email: user.email, name: "New" },
        });

        expect(updated.status).toBe(200);
        expect(cookieValue(updated.setCookies)).toBeUndefined();
        expect(await isSignedIn(withCookie(browser))).toBe(true);
      });

      it("keeps an SSO user's sessions when they create their first password", async () => {
        const user = await createUser({ withPassword: false });
        await prisma.account.create({
          data: {
            userId: user.id,
            type: "oidc",
            provider: "oidc",
            providerAccountId: `session_routes_${user.id}`,
          },
        });
        const browser = await webSession(user.id);
        const phone = await appSession(user.id);

        const created = await call(userRoute, {
          ...withCookie(browser),
          method: "PUT",
          query: { id: String(user.id) },
          body: {
            username: user.username,
            email: user.email,
            newPassword: NEW_PASSWORD,
          },
        });
        expect(created.status).toBe(200);

        expect(await isSignedIn(withCookie(browser))).toBe(true);
        expect(await isSignedIn(bearer(phone))).toBe(true);
      });
    });

    describe("web sessions through next-auth", () => {
      it("signs a browser out on its next page load once the password changed on another device", async () => {
        const user = await createUser();
        const browser = await webSession(user.id);
        const phone = await appSession(user.id);

        expect((await refreshWebSession(browser)).body?.user?.id).toBe(user.id);

        const changed = await changePassword(user, bearer(phone));
        expect(changed.status).toBe(200);

        const refreshed = await refreshWebSession(browser);
        expect(refreshed.body?.user).toBeUndefined();
        expect(cookieValue(refreshed.setCookies)).toBe("");
      });

      it("keeps a signed out session's ID, so copies of its cookie stop working", async () => {
        const user = await createUser();
        const browser = await webSession(user.id);
        const otherBrowser = await webSession(user.id);
        const phone = await appSession(user.id);

        // A refreshed copy has a new jti but the same session ID
        const copy = cookieValue(
          (await refreshWebSession(browser)).setCookies
        ) as string;

        const signedOut = await signOutOfWeb(browser);
        expect(signedOut.body).toEqual({ url: expect.any(String) });
        expect(cookieValue(signedOut.setCookies)).toBe("");

        expect(await isSignedIn(withCookie(browser))).toBe(false);
        expect(await isSignedIn(withCookie(copy))).toBe(false);
        expect(await isSignedIn(withCookie(otherBrowser))).toBe(true);
        expect(await isSignedIn(bearer(phone))).toBe(true);

        // Not listed with the user's access tokens
        const tokens = await prisma.accessToken.findMany({
          where: { userId: user.id, revoked: false },
        });
        expect(tokens.map((token) => token.name)).toEqual(["Phone"]);
      });

      it("still clears the cookie when the account is gone", async () => {
        const user = await createUser();
        const browser = await webSession(user.id);
        await prisma.user.delete({ where: { id: user.id } });

        const signedOut = await signOutOfWeb(browser);

        expect(signedOut.body).toEqual({ url: expect.any(String) });
        expect(cookieValue(signedOut.setCookies)).toBe("");
      });
    });
  }
);
