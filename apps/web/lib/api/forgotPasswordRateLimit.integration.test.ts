import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import path from "path";

// POST /api/v1/auth/forgot-password against a real database (DATABASE_URL).
// The route answers 200 whether or not the address is registered, so that
// nobody can tell which emails have accounts.

// No mail goes out; the reset tokens are still written to the database
vi.mock("@linkwarden/lib/transporter", () => ({
  default: { sendMail: vi.fn(async () => ({})) },
}));

let prisma: typeof import("@linkwarden/prisma").prisma;
let handler: typeof import("@/pages/api/v1/auth/forgot-password").default;

const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const registered = `forgot-${unique()}@example.com`;
const unregistered = `nobody-${unique()}@example.com`;
let userId: number;
const cwd = process.cwd();

const request = async (email: string) => {
  const state = { status: 200, body: undefined as any };
  const res: any = {
    status(code: number) {
      state.status = code;
      return res;
    },
    json(body: any) {
      state.body = body;
      return res;
    },
  };
  await handler({ method: "POST", body: { email } } as any, res);
  return state;
};

describe("forgot-password with a real database", () => {
  beforeAll(async () => {
    // The email template is read relative to the web app's directory
    process.chdir(path.resolve(__dirname, "../.."));
    ({ prisma } = await import("@linkwarden/prisma"));
    handler = (await import("@/pages/api/v1/auth/forgot-password")).default;

    const user = await prisma.user.create({
      data: {
        name: "Forgot",
        username: `forgot-${unique()}`,
        email: registered,
        password: "not-a-real-hash",
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    process.chdir(cwd);
    await prisma.passwordResetToken.deleteMany({
      where: { identifier: { in: [registered, unregistered] } },
    });
    await prisma.user.delete({ where: { id: userId } });
  });

  // Open: the limit counts the reset tokens stored for the address, and tokens
  // are only ever stored for registered addresses, so after three requests a
  // registered email answers 400 while an unknown one keeps answering 200.
  it.fails(
    "answers the same way for registered and unknown emails on every request",
    async () => {
      const known: number[] = [];
      const unknown: number[] = [];

      for (let i = 0; i < 4; i++) {
        known.push((await request(registered)).status);
        unknown.push((await request(unregistered)).status);
        // The route doesn't wait for the token to be stored
        await vi.waitFor(async () => {
          const stored = await prisma.passwordResetToken.count({
            where: { identifier: registered },
          });
          expect(stored).toBeGreaterThanOrEqual(Math.min(i + 1, 3));
        });
      }

      expect(known).toEqual(unknown);
    }
  );

  it("stores a reset token for a registered email", async () => {
    const tokens = await prisma.passwordResetToken.count({
      where: { identifier: registered },
    });
    expect(tokens).toBeGreaterThan(0);
  });
});
