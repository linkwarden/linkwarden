import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Password attempts through the real API routes (the session API, the web
// login, the settings prompts and deleting the account), against a real
// database (DATABASE_URL).

vi.mock("next-i18next.config", () => ({
  i18n: { locales: ["en"] },
}));

vi.mock("@linkwarden/filesystem", () => ({
  createFile: vi.fn(),
  createFolder: vi.fn(),
  removeFile: vi.fn(),
  removeFolder: vi.fn(),
}));

vi.mock("@linkwarden/lib/meilisearchClient", () => ({
  meiliClient: null,
}));

vi.mock("@linkwarden/lib/transporter", () => ({
  default: { sendMail: vi.fn() },
}));

vi.mock("@/lib/api/sendChangeEmailVerificationRequest", () => ({
  default: vi.fn(),
}));

const SECRET = "password-retry-routes-secret";
const COOKIE = "next-auth.session-token";
const PASSWORD = "Corr3ct-horse";
const NEW_PASSWORD = "N3w-battery-staple";

const waitMessage =
  /^Too many incorrect passwords\. Please try again in \d+ seconds?\.$/;

let prisma: typeof import("@linkwarden/prisma").prisma;
let sessionRoute: typeof import("@/pages/api/v1/session").default;
let userRoute: typeof import("@/pages/api/v1/users/[id]").default;
let meRoute: typeof import("@/pages/api/v1/users/me").default;
let authRoute: typeof import("@/pages/api/v1/auth/[...nextauth]").default;
let verifyByCredentials: typeof import("./verifyByCredentials").default;
let createSession: typeof import("./controllers/session/createSession").default;
let sendChangeEmailVerificationRequest: typeof import("@/lib/api/sendChangeEmailVerificationRequest").default;

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
  return { ...state, headers, setCookies };
};

const hasSessionCookie = (setCookies: string[]) =>
  setCookies.some(
    (header) => header.startsWith(`${COOKIE}=`) && !/max-age=0/i.test(header)
  );

const uniqueName = (label: string) =>
  `${label}-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const createUser = async (
  label: string,
  { withPassword = true, emailVerified = true } = {}
) => {
  const username = uniqueName(label);
  const user = await prisma.user.create({
    data: {
      username,
      email: `${username}@lab.test`,
      emailVerified: emailVerified ? new Date() : undefined,
      name: label,
      password: withPassword ? bcrypt.hashSync(PASSWORD, 4) : undefined,
    },
  });
  createdUserIds.push(user.id);
  return user;
};

const apiLogin = (username: string, password: string) =>
  call(sessionRoute, {
    method: "POST",
    body: { username, password },
  });

// What the login page sends through next-auth's signIn("credentials")
const webLogin = (username: string, password?: string) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .createHash("sha256")
    .update(`${csrfToken}${SECRET}`)
    .digest("hex");

  return call(authRoute, {
    method: "POST",
    query: { nextauth: ["callback", "credentials"] },
    headers: { host: "127.0.0.1:3000" },
    cookies: { "next-auth.csrf-token": `${csrfToken}|${hash}` },
    body: { username, password, csrfToken, callbackUrl: "/", json: "true" },
  });
};

// The error signIn() hands the login page, null when it signed in
const webLoginError = (result: Awaited<ReturnType<typeof webLogin>>) =>
  new URL(result.body.url, "http://127.0.0.1:3000").searchParams.get("error");

const failApiLogins = async (username: string, count: number) => {
  for (let i = 0; i < count; i++)
    expect((await apiLogin(username, `wrong-password-${i}`)).status).toBe(400);
};

const bearer = async (userId: number) => ({
  authorization: `Bearer ${
    ((await createSession(userId, "Tests")).response as { token: string }).token
  }`,
});

const putUser = async (
  user: { id: number; username: string | null; email: string | null },
  changes: Record<string, unknown>
) =>
  call(userRoute, {
    method: "PUT",
    query: { id: String(user.id) },
    headers: await bearer(user.id),
    body: { username: user.username, email: user.email, ...changes },
  });

const deleteUser = async (user: { id: number }, password?: string) =>
  call(userRoute, {
    method: "DELETE",
    query: { id: String(user.id) },
    headers: await bearer(user.id),
    body: { password },
  });

describe.skipIf(!process.env.DATABASE_URL)(
  "password retries through the API routes",
  () => {
    beforeAll(async () => {
      // Read when the routes load
      vi.stubEnv("NEXTAUTH_SECRET", SECRET);
      vi.stubEnv("NEXTAUTH_URL", "http://127.0.0.1:3000/api/v1/auth");
      vi.stubEnv("NEXT_PUBLIC_CREDENTIALS_ENABLED", "true");
      vi.stubEnv("STRIPE_SECRET_KEY", "");
      vi.stubEnv("NEXT_PUBLIC_DEMO", "false");
      vi.stubEnv("EMAIL_FROM", "");
      vi.stubEnv("EMAIL_SERVER", "");

      prisma = (await import("@linkwarden/prisma")).prisma;
      sessionRoute = (await import("@/pages/api/v1/session")).default;
      userRoute = (await import("@/pages/api/v1/users/[id]")).default;
      meRoute = (await import("@/pages/api/v1/users/me")).default;
      authRoute = (await import("@/pages/api/v1/auth/[...nextauth]")).default;
      verifyByCredentials = (await import("./verifyByCredentials")).default;
      createSession = (await import("./controllers/session/createSession"))
        .default;
      sendChangeEmailVerificationRequest = (
        await import("@/lib/api/sendChangeEmailVerificationRequest")
      ).default;
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.mocked(sendChangeEmailVerificationRequest).mockClear();
    });

    afterAll(async () => {
      if (!prisma) return;

      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      await prisma.$disconnect();
      vi.unstubAllEnvs();
    });

    // These hold before and after the limit existed: nobody who gets their
    // password right within 15 tries should notice it
    describe("for people who mistype now and then", () => {
      it("the session API signs in on the right password after 14 wrong ones, twice in a row", async () => {
        const user = await createUser("api-typos");

        for (let round = 0; round < 2; round++) {
          await failApiLogins(user.username!, 14);

          const right = await apiLogin(user.username!, PASSWORD);
          expect(right.status).toBe(200);
          expect(typeof right.body.response.token).toBe("string");
        }
      });

      it("the session API gives the same answer for a wrong password and an unknown username", async () => {
        const user = await createUser("api-same-answer");

        const wrong = await apiLogin(user.username!, "wrong-password");
        const unknown = await apiLogin(uniqueName("nobody"), "wrong-password");

        expect(wrong.status).toBe(400);
        expect(unknown).toMatchObject({ status: 400, body: wrong.body });
      });

      it("the session API turns away passwords too short to be valid without counting them", async () => {
        const user = await createUser("api-short");

        for (let i = 0; i < 20; i++) {
          const short = await apiLogin(user.username!, `short${i}`);
          expect(short.status).toBe(400);
          expect(short.body.response).toMatch(/^Error: .* \[password\]$/);
        }

        expect((await apiLogin(user.username!, PASSWORD)).status).toBe(200);
      });

      it("the web login signs in on the right password after 14 wrong ones", async () => {
        const user = await createUser("web-typos");

        for (let i = 0; i < 14; i++) {
          const wrong = await webLogin(user.username!, `wrong-password-${i}`);
          expect(webLoginError(wrong)).toBe("Invalid credentials.");
          expect(hasSessionCookie(wrong.setCookies)).toBe(false);
        }

        const right = await webLogin(user.username!, PASSWORD);
        expect(webLoginError(right)).toBeNull();
        expect(hasSessionCookie(right.setCookies)).toBe(true);
      });

      it("15 logins at once with the right password all go through", async () => {
        const user = await createUser("parallel-right");

        const results = await Promise.all(
          Array.from({ length: 15 }, () => apiLogin(user.username!, PASSWORD))
        );

        expect(results.map((result) => result.status)).toEqual(
          Array(15).fill(200)
        );
      });

      it("changing the password checks the old one", async () => {
        const user = await createUser("change-typos");

        const wrong = await putUser(user, {
          oldPassword: "wrong-password",
          newPassword: NEW_PASSWORD,
        });
        expect(wrong).toMatchObject({
          status: 400,
          body: { response: "Old password is incorrect." },
        });

        const right = await putUser(user, {
          oldPassword: PASSWORD,
          newPassword: NEW_PASSWORD,
        });
        expect(right.status).toBe(200);
        expect((await apiLogin(user.username!, NEW_PASSWORD)).status).toBe(200);
      });

      it("changing the email checks the password and sends the confirmation", async () => {
        const user = await createUser("email-typos");
        const newEmail = `new-${user.email}`;

        const wrong = await putUser(user, {
          email: newEmail,
          password: "wrong-password",
        });
        expect(wrong).toMatchObject({
          status: 400,
          body: { response: "Password is incorrect." },
        });
        expect(sendChangeEmailVerificationRequest).not.toHaveBeenCalled();

        const right = await putUser(user, {
          email: newEmail,
          password: PASSWORD,
        });
        expect(right.status).toBe(200);
        expect(sendChangeEmailVerificationRequest).toHaveBeenCalledWith(
          user.email,
          newEmail,
          user.name
        );
      });

      it("deleting the account works on the right password after a few wrong ones", async () => {
        const user = await createUser("delete-typos");

        for (let i = 0; i < 3; i++)
          expect(await deleteUser(user, `wrong-password-${i}`)).toMatchObject({
            status: 401,
            body: { response: "Invalid credentials." },
          });

        expect((await deleteUser(user, PASSWORD)).status).toBe(200);
        expect(
          await prisma.user.findUnique({ where: { id: user.id } })
        ).toBeNull();
      });

      it("an invited team member can still set their first password", async () => {
        const owner = await createUser("team-owner");
        const subscription = await prisma.subscription.create({
          data: {
            active: true,
            provider: "STRIPE",
            stripeSubscriptionId: uniqueName("sub"),
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
            quantity: 2,
            userId: owner.id,
          },
        });
        const username = uniqueName("invited");
        const invited = await prisma.user.create({
          data: {
            username,
            email: `${username}@lab.test`,
            emailVerified: new Date(),
            parentSubscriptionId: subscription.id,
          },
        });
        createdUserIds.push(invited.id);

        const set = await putUser(invited, {
          name: "Invited",
          password: NEW_PASSWORD,
        });

        expect(set.status).toBe(200);
        expect(set.body.response.hasPassword).toBe(true);
        expect((await apiLogin(username, NEW_PASSWORD)).status).toBe(200);
      });
    });

    describe("after 15 wrong passwords", () => {
      it("the session API answers 429 with Retry-After and creates no session, even for the right password", async () => {
        const user = await createUser("api-throttled");
        await failApiLogins(user.username!, 15);

        const result = await apiLogin(user.username!, PASSWORD);

        expect(result.status).toBe(429);
        expect(result.headers["retry-after"]).toBe("25");
        expect(result.body).toEqual({
          response:
            "Too many incorrect passwords. Please try again in 25 seconds.",
          code: "TOO_MANY_ATTEMPTS",
        });
        expect(
          await prisma.accessToken.count({ where: { userId: user.id } })
        ).toBe(0);
      });

      it("the web login shows the wait and sets no session cookie, even for the right password", async () => {
        const user = await createUser("web-throttled");
        await failApiLogins(user.username!, 15);

        const result = await webLogin(user.username!, PASSWORD);

        expect(webLoginError(result)).toMatch(waitMessage);
        expect(hasSessionCookie(result.setCookies)).toBe(false);
      });

      it("the web login and the session API share one count", async () => {
        const user = await createUser("shared-count");

        for (let i = 0; i < 10; i++)
          expect(
            webLoginError(await webLogin(user.username!, `wrong-web-${i}`))
          ).toBe("Invalid credentials.");
        await failApiLogins(user.username!, 5);

        expect((await apiLogin(user.username!, PASSWORD)).status).toBe(429);
        expect(webLoginError(await webLogin(user.username!, PASSWORD))).toMatch(
          waitMessage
        );
      });

      it("the web login refuses a request without a password field the same way", async () => {
        const user = await createUser("web-no-password");
        await failApiLogins(user.username!, 15);

        // Doesn't reach bcrypt, which throws for a missing password
        expect(webLoginError(await webLogin(user.username!))).toMatch(
          waitMessage
        );
      });

      it("changing the password answers 429 and saves nothing else from the request", async () => {
        const user = await createUser("change-throttled");
        const sessionsBefore = await bearer(user.id);
        await failApiLogins(user.username!, 15);

        const result = await call(userRoute, {
          method: "PUT",
          query: { id: String(user.id) },
          headers: sessionsBefore,
          body: {
            username: user.username,
            email: user.email,
            name: "Renamed",
            oldPassword: PASSWORD,
            newPassword: NEW_PASSWORD,
          },
        });

        expect(result.status).toBe(429);
        expect(result.body.response).toMatch(waitMessage);
        expect(hasSessionCookie(result.setCookies)).toBe(false);

        const after = await prisma.user.findUniqueOrThrow({
          where: { id: user.id },
        });
        expect(after.name).toBe(user.name);
        expect(after.sessionVersion).toBe(user.sessionVersion);
        expect(bcrypt.compareSync(PASSWORD, after.password!)).toBe(true);

        // The session that sent it still works
        expect((await call(meRoute, { headers: sessionsBefore })).status).toBe(
          200
        );
      });

      it("changing the email answers 429 and sends no confirmation", async () => {
        const user = await createUser("email-throttled");
        await failApiLogins(user.username!, 15);

        const result = await putUser(user, {
          email: `new-${user.email}`,
          password: PASSWORD,
        });

        expect(result.status).toBe(429);
        expect(result.body.response).toMatch(waitMessage);
        expect(sendChangeEmailVerificationRequest).not.toHaveBeenCalled();
        expect(
          (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
            .email
        ).toBe(user.email);
      });

      it("deleting the account answers 429 and keeps the account and its collections", async () => {
        const user = await createUser("delete-throttled");
        const collection = await prisma.collection.create({
          data: { name: "Keep me", ownerId: user.id, createdById: user.id },
        });
        await failApiLogins(user.username!, 15);

        const result = await deleteUser(user, PASSWORD);

        expect(result.status).toBe(429);
        expect(result.body.response).toMatch(waitMessage);
        expect(
          await prisma.user.findUnique({ where: { id: user.id } })
        ).not.toBeNull();
        expect(
          await prisma.collection.findUnique({ where: { id: collection.id } })
        ).not.toBeNull();
      });

      it("never counts attempts for an account without a password", async () => {
        const user = await createUser("no-password", { withPassword: false });

        for (let i = 0; i < 20; i++)
          expect((await apiLogin(user.username!, PASSWORD)).status).toBe(400);

        expect(
          await prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            select: { passwordRetries: true, passwordRetryAt: true },
          })
        ).toEqual({ passwordRetries: 0, passwordRetryAt: null });
      });
    });

    // The demo's password is shown on its login page, so the limit would only
    // let anyone keep every visitor from signing in
    describe("on a demo instance", () => {
      const startDemo = (username: string) => {
        vi.stubEnv("NEXT_PUBLIC_DEMO", "true");
        vi.stubEnv("NEXT_PUBLIC_DEMO_USERNAME", username);
        vi.stubEnv("NEXT_PUBLIC_DEMO_PASSWORD", PASSWORD);
      };

      afterEach(() => {
        vi.stubEnv("NEXT_PUBLIC_DEMO", "false");
        vi.stubEnv("NEXT_PUBLIC_DEMO_USERNAME", "");
        vi.stubEnv("NEXT_PUBLIC_DEMO_PASSWORD", "");
      });

      it("the demo account signs in after any number of wrong passwords, without counting them", async () => {
        const demo = await createUser("demo");
        startDemo(demo.username!);

        for (let i = 0; i < 10; i++)
          expect(
            webLoginError(await webLogin(demo.username!, `wrong-web-${i}`))
          ).toBe("Invalid credentials.");
        await failApiLogins(demo.username!, 10);

        // What the "Login as demo user" button sends
        const result = await webLogin(demo.username!, PASSWORD);
        expect(webLoginError(result)).toBeNull();
        expect(hasSessionCookie(result.setCookies)).toBe(true);
        expect((await apiLogin(demo.username!, PASSWORD)).status).toBe(200);
        expect(
          await prisma.user.findUniqueOrThrow({
            where: { id: demo.id },
            select: { passwordRetries: true, passwordRetryAt: true },
          })
        ).toEqual({ passwordRetries: 0, passwordRetryAt: null });
      });

      it("the demo account signs in even if it was locked before the update", async () => {
        const demo = await createUser("demo-locked");
        await prisma.user.update({
          where: { id: demo.id },
          data: { passwordRetries: 40, passwordRetryAt: new Date() },
        });
        startDemo(demo.username!);

        expect(webLoginError(await webLogin(demo.username!, PASSWORD))).toBe(
          null
        );
      });

      it("the demo username matches in any case, like the login does", async () => {
        const demo = await createUser("demo-case");
        startDemo(demo.username!.toUpperCase());
        await failApiLogins(demo.username!, 15);

        expect((await apiLogin(demo.username!, PASSWORD)).status).toBe(200);
      });

      it("the web login refuses the demo account without a password field like any wrong password", async () => {
        const demo = await createUser("demo-no-password");
        startDemo(demo.username!);

        expect(webLoginError(await webLogin(demo.username!))).toBe(
          "Invalid credentials."
        );
      });

      it("other accounts on the demo instance keep the limit", async () => {
        const demo = await createUser("demo-owner");
        const other = await createUser("demo-admin");
        startDemo(demo.username!);
        await failApiLogins(other.username!, 15);

        expect((await apiLogin(other.username!, PASSWORD)).status).toBe(429);
      });

      it("an account named like the demo keeps the limit when demo mode is off", async () => {
        const user = await createUser("not-demo");
        startDemo(user.username!);
        vi.stubEnv("NEXT_PUBLIC_DEMO", "false");
        await failApiLogins(user.username!, 15);

        expect((await apiLogin(user.username!, PASSWORD)).status).toBe(429);
      });
    });

    describe("with email enabled", () => {
      afterEach(() => {
        vi.stubEnv("EMAIL_FROM", "");
        vi.stubEnv("EMAIL_SERVER", "");
        vi.resetModules();
      });

      it("counts wrong passwords by email, by username and in any case together", async () => {
        // Read when verifyByCredentials loads
        vi.stubEnv("EMAIL_FROM", "noreply@lab.test");
        vi.stubEnv("EMAIL_SERVER", "smtp://127.0.0.1:2525");
        vi.resetModules();
        const verify = (await import("./verifyByCredentials")).default;
        const user = await createUser("email-or-username");

        const attempts = [
          ...Array(5).fill(user.username!),
          ...Array(5).fill(user.email!),
          ...Array(5).fill(user.email!.toUpperCase()),
        ];
        for (let i = 0; i < attempts.length; i++)
          expect(
            (await verify({ username: attempts[i], password: `wrong-${i}` }))
              .status
          ).toBe("invalid_credentials");

        expect(
          (
            await verify({
              username: user.username!.toUpperCase(),
              password: PASSWORD,
            })
          ).status
        ).toBe("too_many_attempts");
      });
    });

    describe("timing", () => {
      const throttle = (id: number, lastAttempt: Date) =>
        prisma.user.update({
          where: { id },
          data: { passwordRetries: 15, passwordRetryAt: lastAttempt },
        });

      const at = (time: number) => vi.spyOn(Date, "now").mockReturnValue(time);

      it("checks an attempt exactly 25 seconds after the last one", async () => {
        const user = await createUser("boundary-old");
        const lastAttempt = new Date(Date.now() - 60_000);
        await throttle(user.id, lastAttempt);

        at(lastAttempt.getTime() + 25_000);
        expect(
          (
            await verifyByCredentials({
              username: user.username!,
              password: PASSWORD,
            })
          ).status
        ).toBe("success");
      });

      it("refuses one a millisecond sooner, with 1 second left", async () => {
        const user = await createUser("boundary-recent");
        const lastAttempt = new Date(Date.now() - 60_000);
        await throttle(user.id, lastAttempt);

        at(lastAttempt.getTime() + 24_999);
        expect(
          await verifyByCredentials({
            username: user.username!,
            password: PASSWORD,
          })
        ).toEqual({
          status: "too_many_attempts",
          response:
            "Too many incorrect passwords. Please try again in 1 second.",
          retryAfter: 1,
        });
      });

      it("treats a last attempt up to 25 seconds ahead as recent, and one further ahead as a wrong clock", async () => {
        const user = await createUser("boundary-future");
        const lastAttempt = new Date(Date.now() + 60_000);
        await throttle(user.id, lastAttempt);

        // Up to 50 seconds are left, but no more than 25 are shown
        at(lastAttempt.getTime() - 25_000);
        expect(
          await verifyByCredentials({
            username: user.username!,
            password: PASSWORD,
          })
        ).toMatchObject({ status: "too_many_attempts", retryAfter: 25 });

        at(lastAttempt.getTime() - 25_001);
        expect(
          (
            await verifyByCredentials({
              username: user.username!,
              password: PASSWORD,
            })
          ).status
        ).toBe("success");
      });
    });
  }
);
