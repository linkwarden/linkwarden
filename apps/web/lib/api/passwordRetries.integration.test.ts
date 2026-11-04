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

// Runs against a real database (DATABASE_URL), since what matters here is how
// Postgres handles parallel password attempts for the same account.

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

let prisma: typeof import("@linkwarden/prisma").prisma;
let verifyByCredentials: typeof import("./verifyByCredentials").default;
let updateUserById: typeof import("./controllers/users/userId/updateUserById").default;
let deleteUserById: typeof import("./controllers/users/userId/deleteUserById").default;
let resetPassword: typeof import("@/pages/api/v1/auth/reset-password").default;

const password = "Corr3ct-horse";
const createdIds: number[] = [];

const uniqueName = (label: string) =>
  `${label}-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const createUser = async (label: string, withPassword = true) => {
  const username = uniqueName(label);
  const user = await prisma.user.create({
    data: {
      username,
      email: `${username}@lab.test`,
      name: label,
      password: withPassword ? bcrypt.hashSync(password, 4) : null,
    },
  });
  createdIds.push(user.id);
  return user;
};

const login = (username: string, attempt: string) =>
  verifyByCredentials({ username, password: attempt });

const failLogins = async (username: string, count: number) => {
  for (let i = 0; i < count; i++)
    expect((await login(username, `wrong-${i}`)).status).toBe(
      "invalid_credentials"
    );
};

const retries = (id: number) =>
  prisma.user.findUniqueOrThrow({
    where: { id },
    select: { passwordRetries: true, passwordRetryAt: true },
  });

// Sets the last counted attempt to this many ms from now
const moveLastAttempt = (id: number, ms: number) =>
  prisma.user.update({
    where: { id },
    data: { passwordRetryAt: new Date(Date.now() + ms) },
  });

const tally = (statuses: string[]) =>
  statuses.reduce<Record<string, number>>((acc, status) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

// The body the settings page sends, plus the fields being changed
const settings = (
  user: { username: string | null; email: string | null; name: string | null },
  changes: Record<string, unknown>
) => ({
  username: user.username,
  email: user.email,
  name: user.name,
  ...changes,
});

const mockResponse = () => {
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

describe.skipIf(!process.env.DATABASE_URL)(
  "password retries with a real database",
  () => {
    beforeAll(async () => {
      prisma = (await import("@linkwarden/prisma")).prisma;
      verifyByCredentials = (await import("./verifyByCredentials")).default;
      updateUserById = (
        await import("./controllers/users/userId/updateUserById")
      ).default;
      deleteUserById = (
        await import("./controllers/users/userId/deleteUserById")
      ).default;
      resetPassword = (await import("@/pages/api/v1/auth/reset-password"))
        .default;
    });

    afterEach(async () => {
      const ids = createdIds.splice(0, createdIds.length);
      await prisma.passwordResetToken.deleteMany({
        where: { token: { startsWith: "retries-" } },
      });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    describe("logging in", () => {
      it("logs in with the right password and rejects a wrong one", async () => {
        const user = await createUser("login");

        expect((await login(user.username!, "wrong-password")).status).toBe(
          "invalid_credentials"
        );
        expect((await login(user.username!, password)).status).toBe("success");
      });

      it("rejects unknown usernames and accounts without a password", async () => {
        const sso = await createUser("sso", false);

        expect((await login(uniqueName("nobody"), password)).status).toBe(
          "invalid_credentials"
        );
        expect((await login(sso.username!, password)).status).toBe(
          "invalid_credentials"
        );
      });

      it("refuses the next attempt right after 15 wrong passwords, even the right one", async () => {
        const user = await createUser("throttled");
        await failLogins(user.username!, 15);

        expect(await login(user.username!, password)).toEqual({
          status: "too_many_attempts",
          response:
            "Too many incorrect passwords. Please try again in 25 seconds.",
          retryAfter: 25,
        });
      });

      it("checks only 15 of 40 parallel wrong passwords", async () => {
        const user = await createUser("parallel");

        const results = await Promise.all(
          Array.from({ length: 40 }, (_, i) =>
            login(user.username!, `parallel-${i}`)
          )
        );

        expect(tally(results.map((result) => result.status))).toEqual({
          invalid_credentials: 15,
          too_many_attempts: 25,
        });
      });

      it("doesn't slow down other accounts", async () => {
        const target = await createUser("target");
        const other = await createUser("bystander");
        await failLogins(target.username!, 15);

        expect((await login(other.username!, "wrong-password")).status).toBe(
          "invalid_credentials"
        );
        expect((await login(other.username!, password)).status).toBe("success");
      });
    });

    describe("the in-app password prompts", () => {
      it("checks the old password when changing the password", async () => {
        const user = await createUser("change");

        const wrong = await updateUserById(
          user.id,
          settings(user, {
            oldPassword: "wrong-password",
            newPassword: "N3w-password",
          }) as any
        );
        expect(wrong).toEqual({
          response: "Old password is incorrect.",
          status: 400,
        });

        const same = await updateUserById(
          user.id,
          settings(user, {
            oldPassword: password,
            newPassword: password,
          }) as any
        );
        expect(same).toEqual({
          response: "New password must be different from the old password.",
          status: 400,
        });

        const changed = await updateUserById(
          user.id,
          settings(user, {
            oldPassword: password,
            newPassword: "N3w-password",
          }) as any
        );
        expect(changed.status).toBe(200);
        expect((await login(user.username!, "N3w-password")).status).toBe(
          "success"
        );
      });

      it("checks the password when changing the email", async () => {
        const user = await createUser("email");

        const wrong = await updateUserById(
          user.id,
          settings(user, {
            email: `new-${user.email}`,
            password: "wrong-password",
          }) as any
        );
        expect(wrong).toEqual({
          response: "Password is incorrect.",
          status: 400,
        });

        const right = await updateUserById(
          user.id,
          settings(user, { email: `new-${user.email}`, password }) as any
        );
        expect(right.status).toBe(200);
      });

      it("checks the password when deleting the account", async () => {
        const user = await createUser("delete");

        expect(
          await deleteUserById(
            user.id,
            { password: "wrong-password" } as any,
            false,
            user.id
          )
        ).toEqual({ response: "Invalid credentials.", status: 401 });
        expect(
          await prisma.user.findUnique({ where: { id: user.id } })
        ).not.toBeNull();

        const deleted = await deleteUserById(
          user.id,
          { password } as any,
          false,
          user.id
        );
        expect(deleted.status).toBe(200);
        expect(
          await prisma.user.findUnique({ where: { id: user.id } })
        ).toBeNull();
      });

      it("refuses the old password prompt after 15 wrong passwords", async () => {
        const user = await createUser("prompt");

        for (let i = 0; i < 15; i++)
          expect(
            (
              await updateUserById(
                user.id,
                settings(user, {
                  oldPassword: `wrong-pass-${i}`,
                  newPassword: "N3w-password",
                }) as any
              )
            ).status
          ).toBe(400);

        const result = await updateUserById(
          user.id,
          settings(user, {
            oldPassword: password,
            newPassword: "N3w-password",
          }) as any
        );
        expect(result.status).toBe(429);
        expect((await login(user.username!, password)).status).toBe(
          "too_many_attempts"
        );
      });
    });

    describe("resetting the password", () => {
      it("sets the new password", async () => {
        const user = await createUser("reset");
        const token = `retries-${uniqueName("token")}`;
        await prisma.passwordResetToken.create({
          data: {
            identifier: user.email!,
            token,
            expires: new Date(Date.now() + 60 * 60 * 1000),
          },
        });

        const { res, state } = mockResponse();
        await resetPassword(
          {
            method: "POST",
            body: { token, password: "R3set-password" },
          } as any,
          res
        );

        expect(state.statusCode).toBe(200);
        expect((await login(user.username!, "R3set-password")).status).toBe(
          "success"
        );
      });

      it("starts the count over", async () => {
        const user = await createUser("reset-count");
        await failLogins(user.username!, 15);
        const token = `retries-${uniqueName("token")}`;
        await prisma.passwordResetToken.create({
          data: {
            identifier: user.email!,
            token,
            expires: new Date(Date.now() + 60 * 60 * 1000),
          },
        });

        const { res, state } = mockResponse();
        await resetPassword(
          {
            method: "POST",
            body: { token, password: "R3set-password" },
          } as any,
          res
        );

        expect(state.statusCode).toBe(200);
        expect(await retries(user.id)).toEqual({
          passwordRetries: 0,
          passwordRetryAt: null,
        });
        expect((await login(user.username!, "R3set-password")).status).toBe(
          "success"
        );
      });
    });

    describe("after 15 wrong passwords", () => {
      it("lets one attempt through every 25 seconds", async () => {
        const user = await createUser("window");
        await failLogins(user.username!, 15);
        expect((await login(user.username!, "wrong-again")).status).toBe(
          "too_many_attempts"
        );

        await moveLastAttempt(user.id, -26_000);
        expect((await login(user.username!, "wrong-again")).status).toBe(
          "invalid_credentials"
        );
        expect(await login(user.username!, password)).toMatchObject({
          status: "too_many_attempts",
          retryAfter: 25,
        });
        expect((await retries(user.id)).passwordRetries).toBe(16);
      });

      it("says how long is left", async () => {
        const user = await createUser("countdown");
        await failLogins(user.username!, 15);

        await moveLastAttempt(user.id, -10_000);
        expect(await login(user.username!, password)).toEqual({
          status: "too_many_attempts",
          response:
            "Too many incorrect passwords. Please try again in 15 seconds.",
          retryAfter: 15,
        });

        await moveLastAttempt(user.id, -24_500);
        expect(await login(user.username!, password)).toMatchObject({
          response:
            "Too many incorrect passwords. Please try again in 1 second.",
          retryAfter: 1,
        });
      });

      it("logs in with the right password once the wait is over, and starts the count over", async () => {
        const user = await createUser("recovered");
        await failLogins(user.username!, 15);

        await moveLastAttempt(user.id, -26_000);
        expect((await login(user.username!, password)).status).toBe("success");
        expect(await retries(user.id)).toEqual({
          passwordRetries: 0,
          passwordRetryAt: null,
        });
        await failLogins(user.username!, 15);
      });

      it("checks only one of 20 parallel wrong passwords once the wait is over", async () => {
        const user = await createUser("parallel-window");
        await failLogins(user.username!, 15);
        await moveLastAttempt(user.id, -26_000);

        const results = await Promise.all(
          Array.from({ length: 20 }, (_, i) =>
            login(user.username!, `parallel-${i}`)
          )
        );

        expect(tally(results.map((result) => result.status))).toEqual({
          invalid_credentials: 1,
          too_many_attempts: 19,
        });
        expect((await retries(user.id)).passwordRetries).toBe(16);
      });

      // A correct password starts the count over, so attempts still in flight
      // after it can go through too. Only the right password can do that.
      it("lets the right password through among parallel attempts once the wait is over", async () => {
        const user = await createUser("parallel-right");
        await failLogins(user.username!, 15);
        await moveLastAttempt(user.id, -26_000);

        const results = await Promise.all(
          Array.from({ length: 20 }, () => login(user.username!, password))
        );
        const statuses = tally(results.map((result) => result.status));

        expect(statuses.success).toBeGreaterThanOrEqual(1);
        expect(statuses.success + (statuses.too_many_attempts || 0)).toBe(20);
        expect((await retries(user.id)).passwordRetries).toBe(0);
      });

      it("isn't locked by a last attempt far in the future, like one written by a wrong clock", async () => {
        const user = await createUser("clock");
        await failLogins(user.username!, 15);

        // Within the delay it still counts as recent
        await moveLastAttempt(user.id, 20_000);
        expect((await login(user.username!, password)).status).toBe(
          "too_many_attempts"
        );

        await moveLastAttempt(user.id, 60 * 60 * 1000);
        expect((await login(user.username!, password)).status).toBe("success");
      });

      it("refuses the email and delete account prompts too", async () => {
        const user = await createUser("shared");
        await failLogins(user.username!, 15);

        expect(
          await updateUserById(
            user.id,
            settings(user, { email: `new-${user.email}`, password }) as any
          )
        ).toMatchObject({ status: 429 });
        expect(
          await deleteUserById(user.id, { password } as any, false, user.id)
        ).toMatchObject({ status: 429 });
        expect(
          await prisma.user.findUnique({ where: { id: user.id } })
        ).not.toBeNull();
      });

      it("counts wrong passwords from the prompts toward the login limit", async () => {
        const user = await createUser("prompt-count");
        await failLogins(user.username!, 10);

        for (let i = 0; i < 5; i++)
          expect(
            await deleteUserById(
              user.id,
              { password: `wrong-pass-${i}` } as any,
              false,
              user.id
            )
          ).toEqual({ response: "Invalid credentials.", status: 401 });

        expect((await login(user.username!, password)).status).toBe(
          "too_many_attempts"
        );
      });

      it("starts the count over when a password is created for an SSO account", async () => {
        const user = await createUser("sso-create", false);
        await prisma.account.create({
          data: {
            userId: user.id,
            type: "oidc",
            provider: "authentik",
            providerAccountId: uniqueName("sso"),
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordRetries: 15, passwordRetryAt: new Date() },
        });

        const created = await updateUserById(
          user.id,
          settings(user, { newPassword: "N3w-password" }) as any
        );

        expect(created.status).toBe(200);
        expect(await retries(user.id)).toEqual({
          passwordRetries: 0,
          passwordRetryAt: null,
        });
        expect((await login(user.username!, "N3w-password")).status).toBe(
          "success"
        );
      });

      it("keeps the count when other settings are saved", async () => {
        const user = await createUser("other-settings");
        await failLogins(user.username!, 15);

        const saved = await updateUserById(
          user.id,
          settings(user, { name: "Renamed" }) as any
        );

        expect(saved.status).toBe(200);
        expect((await retries(user.id)).passwordRetries).toBe(15);
      });
    });
  }
);
