import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import path from "path";
import bcrypt from "bcrypt";

// The forgot-password and reset-password routes together, against a real
// database (DATABASE_URL). Mail isn't sent; the messages are kept to read the
// reset link from.

const { sendMail } = vi.hoisted(() => ({
  sendMail: vi.fn(async (_message: any) => ({})),
}));
vi.mock("@linkwarden/lib/transporter", () => ({ default: { sendMail } }));

let prisma: typeof import("@linkwarden/prisma").prisma;
let forgotPassword: typeof import("@/pages/api/v1/auth/forgot-password").default;
let resetPassword: typeof import("@/pages/api/v1/auth/reset-password").default;

const cwd = process.cwd();
const run = `${Date.now().toString(36)}${Math.random()
  .toString(36)
  .slice(2, 6)}`;
const createdUserIds: number[] = [];
const emailsUsed: string[] = [];

const call = async (handler: any, body: unknown) => {
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
  await handler({ method: "POST", body } as any, res);
  return state;
};

// Stored as given, like an account an SSO provider created
async function createAccount(label: string, email: string) {
  const user = await prisma.user.create({
    data: {
      name: label,
      username: `${label}-${run}`.toLowerCase(),
      email,
      password: await bcrypt.hash("old-password", 4),
    },
  });
  createdUserIds.push(user.id);
  emailsUsed.push(email);
  return user;
}

const tokensFor = (identifier: string) =>
  prisma.passwordResetToken.findMany({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });

// The route doesn't wait for the email to go out
async function requestReset(email: string) {
  const before = sendMail.mock.calls.length;
  const answer = await call(forgotPassword, { email });
  return { answer, before };
}

async function waitForResetMail(before: number) {
  await vi.waitFor(() =>
    expect(sendMail.mock.calls.length).toBeGreaterThan(before)
  );
  const message = sendMail.mock.calls[sendMail.mock.calls.length - 1][0];
  // Handlebars writes the "=" of the link as &#x3D;
  const token = String(message.html).match(
    /reset-password\?token(?:=|&#x3D;)([0-9a-f]+)/
  )?.[1];
  expect(token).toBeTruthy();
  return { to: message.to as string, token: token! };
}

// Gives any reset email a moment to show up before checking none was sent
const settle = () => new Promise((resolve) => setTimeout(resolve, 300));

const passwordIs = async (userId: number, password: string) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return bcrypt.compare(password, user.password!);
};

describe("password reset by email with a real database", () => {
  beforeAll(async () => {
    // The email template is read relative to the web app's directory
    process.chdir(path.resolve(__dirname, "../.."));
    ({ prisma } = await import("@linkwarden/prisma"));
    forgotPassword = (await import("@/pages/api/v1/auth/forgot-password"))
      .default;
    resetPassword = (await import("@/pages/api/v1/auth/reset-password"))
      .default;
  });

  beforeEach(() => {
    sendMail.mockClear();
  });

  afterAll(async () => {
    process.chdir(cwd);
    await prisma.passwordResetToken.deleteMany({
      where: {
        identifier: {
          in: [...emailsUsed, ...emailsUsed.map((e) => e.toLowerCase())],
        },
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("resets the password of an account however its email is capitalized when typed", async () => {
    const email = `alice-${run}@example.com`;
    const user = await createAccount("alice", email);

    const { answer, before } = await requestReset(`Alice-${run}@Example.COM`);
    expect(answer.status).toBe(200);
    const mail = await waitForResetMail(before);
    expect(mail.to).toBe(email);

    const reset = await call(resetPassword, {
      token: mail.token,
      password: "new-password-1",
    });
    expect(reset.status).toBe(200);
    expect(await passwordIs(user.id, "new-password-1")).toBe(true);
  });

  it("ignores spaces around the email", async () => {
    const email = `spaces-${run}@example.com`;
    await createAccount("spaces", email);

    const { answer, before } = await requestReset(`  ${email}  `);
    expect(answer.status).toBe(200);
    expect((await waitForResetMail(before)).to).toBe(email);
  });

  it("resets an account whose email is stored with capitals when it's typed the same way", async () => {
    const email = `Bob.Mixed-${run}@Example.com`;
    const user = await createAccount("bob", email);

    const { answer, before } = await requestReset(email);
    expect(answer.status).toBe(200);
    const mail = await waitForResetMail(before);
    expect(mail.to).toBe(email);

    const reset = await call(resetPassword, {
      token: mail.token,
      password: "new-password-2",
    });
    expect(reset.status).toBe(200);
    expect(await passwordIs(user.id, "new-password-2")).toBe(true);
    // Every other session of the account is signed out, as with any reset
    const after = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(after.sessionVersion).toBe(user.sessionVersion + 1);
  });

  it("sends the reset to the account spelled exactly as typed when two differ only in case", async () => {
    const lower = await createAccount("twin-lower", `twin-${run}@example.com`);
    const upper = await createAccount("twin-upper", `Twin-${run}@example.com`);

    let request = await requestReset(upper.email!);
    expect((await waitForResetMail(request.before)).to).toBe(upper.email);

    request = await requestReset(`TWIN-${run}@EXAMPLE.COM`);
    expect((await waitForResetMail(request.before)).to).toBe(lower.email);
  });

  it("counts every spelling of an email towards the same limit", async () => {
    const email = `limit-${run}@example.com`;
    await createAccount("limit", email);

    for (const spelling of [
      email,
      email.toUpperCase(),
      `Limit-${run}@Example.com`,
    ]) {
      const { answer, before } = await requestReset(spelling);
      expect(answer.status).toBe(200);
      await waitForResetMail(before);
    }

    const fourth = await requestReset(`LiMiT-${run}@example.com`);
    await settle();
    expect(fourth.answer.status).toBe(400);
    expect(sendMail.mock.calls.length).toBe(fourth.before);
    expect(await tokensFor(email)).toHaveLength(3);
  });

  it("sends nothing for an email no account has, however it's typed", async () => {
    const { answer, before } = await requestReset(`Nobody-${run}@Example.com`);
    await settle();
    expect(answer.status).toBe(200);
    expect(sendMail.mock.calls.length).toBe(before);
  });

  it("refuses something that isn't an email", async () => {
    expect((await call(forgotPassword, { email: "not an email" })).status).toBe(
      400
    );
    expect((await call(forgotPassword, { email: 42 })).status).toBe(400);
    expect((await call(forgotPassword, {})).status).toBe(400);
  });

  it("still accepts a reset link sent before this change, which recorded the email lowercased", async () => {
    const email = `older-${run}@example.com`;
    const user = await createAccount("older", email);
    const token = `older${run}`.padEnd(64, "0");
    await prisma.passwordResetToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const reset = await call(resetPassword, {
      token,
      password: "new-password-3",
    });
    expect(reset.status).toBe(200);
    expect(await passwordIs(user.id, "new-password-3")).toBe(true);
  });

  it("refuses a reset link that was already used or has expired", async () => {
    const email = `used-${run}@example.com`;
    await createAccount("used", email);

    const { before } = await requestReset(email);
    const { token } = await waitForResetMail(before);
    expect(
      (await call(resetPassword, { token, password: "new-password-4" })).status
    ).toBe(200);
    expect(
      (await call(resetPassword, { token, password: "new-password-5" })).status
    ).toBe(400);

    const expired = `expired${run}`.padEnd(64, "0");
    await prisma.passwordResetToken.create({
      data: {
        identifier: email,
        token: expired,
        expires: new Date(Date.now() - 1000),
      },
    });
    expect(
      (
        await call(resetPassword, {
          token: expired,
          password: "new-password-6",
        })
      ).status
    ).toBe(400);
  });

  it("refuses a reset link whose account was deleted since", async () => {
    const email = `deleted-${run}@example.com`;
    const user = await createAccount("deleted", email);

    const { before } = await requestReset(email);
    const { token } = await waitForResetMail(before);
    await prisma.user.delete({ where: { id: user.id } });

    const reset = await call(resetPassword, {
      token,
      password: "new-password-7",
    });
    expect(reset.status).toBe(400);
  });
});
