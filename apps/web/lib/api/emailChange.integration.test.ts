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

// Changing the email from the account settings, from saving the settings to
// opening the verification link, against a real database (DATABASE_URL). Mail
// isn't sent; the messages are kept to read the link from.

const { sendMail } = vi.hoisted(() => ({
  sendMail: vi.fn(async (_message: any) => ({})),
}));
vi.mock("@linkwarden/lib/transporter", () => ({ default: { sendMail } }));

vi.mock("next-i18next.config", () => ({
  i18n: { locales: ["en"] },
}));

vi.mock("@linkwarden/filesystem", () => ({
  createFile: vi.fn(),
  createFolder: vi.fn(),
  removeFile: vi.fn(),
  removeFolder: vi.fn(),
}));

let prisma: typeof import("@linkwarden/prisma").prisma;
let updateUserById: typeof import("./controllers/users/userId/updateUserById").default;
let verifyEmail: typeof import("@/pages/api/v1/auth/verify-email").default;

const cwd = process.cwd();
const run = `${Date.now().toString(36)}${Math.random()
  .toString(36)
  .slice(2, 6)}`;
const password = "Corr3ct-horse";
const createdUserIds: number[] = [];
const emailsUsed: string[] = [];

// Stored as given, like an account from before emails were lowercased
async function createAccount(label: string, email: string) {
  const user = await prisma.user.create({
    data: {
      name: label,
      username: `${label}-${run}`.toLowerCase(),
      email,
      emailVerified: new Date(),
      password: await bcrypt.hash(password, 4),
    },
  });
  createdUserIds.push(user.id);
  emailsUsed.push(email);
  return user;
}

// The body the account settings page sends: the account as it was loaded, plus
// the fields being changed
const settings = (
  user: { username: string | null; email: string | null; name: string | null },
  changes: Record<string, unknown>
) =>
  ({
    username: user.username,
    email: user.email,
    name: user.name,
    ...changes,
  }) as any;

const stored = (id: number) => prisma.user.findUniqueOrThrow({ where: { id } });

const verify = async (token: string) => {
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
  await verifyEmail({ method: "POST", query: { token } } as any, res);
  return state;
};

// Saving the settings doesn't wait for the verification email to go out
async function waitForChangeMail(before: number) {
  await vi.waitFor(() =>
    expect(sendMail.mock.calls.length).toBeGreaterThan(before)
  );
  const message = sendMail.mock.calls[sendMail.mock.calls.length - 1][0];
  // Handlebars writes the "=" of the link as &#x3D;
  const token = String(message.html).match(
    /verify-email\?token(?:=|&#x3D;)([0-9a-f]+)/
  )?.[1];
  expect(token).toBeTruthy();
  return { to: message.to as string, token: token! };
}

// Gives a verification email a moment to show up before checking none was sent
const settle = () => new Promise((resolve) => setTimeout(resolve, 300));

describe("changing the email in the account settings, with a real database", () => {
  beforeAll(async () => {
    // Email is on, as on Cloud. The settings route reads this when it loads.
    vi.stubEnv("EMAIL_FROM", "linkwarden@example.com");
    vi.stubEnv("EMAIL_SERVER", "smtp://127.0.0.1:1");
    vi.stubEnv("BASE_URL", "http://localhost:3000");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO", "");
    // The email template is read relative to the web app's directory
    process.chdir(path.resolve(__dirname, "../.."));
    ({ prisma } = await import("@linkwarden/prisma"));
    updateUserById = (await import("./controllers/users/userId/updateUserById"))
      .default;
    verifyEmail = (await import("@/pages/api/v1/auth/verify-email")).default;
  });

  beforeEach(() => {
    sendMail.mockClear();
  });

  afterAll(async () => {
    process.chdir(cwd);
    vi.unstubAllEnvs();
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: {
          in: [...emailsUsed, ...emailsUsed.map((e) => e.toLowerCase())],
        },
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  describe("an account whose email is stored with capitals", () => {
    it("saves its other settings without asking for the password", async () => {
      const user = await createAccount(
        "caps-name",
        `Caps.Name-${run}@Example.com`
      );

      const saved = await updateUserById(
        user.id,
        settings(user, { name: "Renamed" })
      );

      expect(saved.status).toBe(200);
      const after = await stored(user.id);
      expect(after.name).toBe("Renamed");
      expect(after.email).toBe(user.email);
      expect(after.unverifiedNewEmail).toBeNull();
      await settle();
      expect(sendMail).not.toHaveBeenCalled();
    });

    it("changes its password from the password settings", async () => {
      const user = await createAccount(
        "caps-newpass",
        `Caps.NewPass-${run}@Example.com`
      );

      // What the password settings page sends
      const changed = await updateUserById(user.id, {
        id: user.id,
        username: user.username,
        email: user.email,
        newPassword: "N3w-password",
        oldPassword: password,
      } as any);

      expect(changed.status).toBe(200);
      const after = await stored(user.id);
      expect(await bcrypt.compare("N3w-password", after.password!)).toBe(true);
      // Like any password change, it signs out the other sessions
      expect(after.sessionVersion).toBe(user.sessionVersion + 1);
    });

    it("changes its email to a new one once the new one is verified", async () => {
      const user = await createAccount(
        "caps-change",
        `Caps.Change-${run}@Example.com`
      );
      const newEmail = `caps-new-${run}@example.com`;
      emailsUsed.push(newEmail);

      const requested = await updateUserById(
        user.id,
        settings(user, { email: newEmail, password })
      );
      expect(requested.status).toBe(200);

      const mail = await waitForChangeMail(0);
      expect(mail.to).toBe(newEmail);
      // Nothing changes until the new address is verified
      expect((await stored(user.id)).email).toBe(user.email);

      const verified = await verify(mail.token);
      expect(verified.status).toBe(200);
      const after = await stored(user.id);
      expect(after.email).toBe(newEmail);
      expect(after.unverifiedNewEmail).toBeNull();
    });

    it("can retype its email in lowercase, which is verified like any change", async () => {
      const email = `Caps.Retype-${run}@Example.com`;
      const user = await createAccount("caps-retype", email);

      const requested = await updateUserById(
        user.id,
        settings(user, { email: email.toLowerCase(), password })
      );
      expect(requested.status).toBe(200);

      const mail = await waitForChangeMail(0);
      expect(mail.to).toBe(email.toLowerCase());
      expect((await verify(mail.token)).status).toBe(200);
      expect((await stored(user.id)).email).toBe(email.toLowerCase());
    });

    it("still needs the right password to change its email", async () => {
      const user = await createAccount(
        "caps-password",
        `Caps.Password-${run}@Example.com`
      );
      const newEmail = `caps-other-${run}@example.com`;

      expect(
        await updateUserById(user.id, settings(user, { email: newEmail }))
      ).toEqual({ response: "Invalid password.", status: 400 });
      expect(
        await updateUserById(
          user.id,
          settings(user, { email: newEmail, password: "wrong-password" })
        )
      ).toEqual({ response: "Password is incorrect.", status: 400 });

      await settle();
      expect(sendMail).not.toHaveBeenCalled();
      expect((await stored(user.id)).unverifiedNewEmail).toBeNull();
    });
  });

  describe("an account whose email is stored lowercase, as every account is today", () => {
    it("saves its other settings without asking for the password", async () => {
      const user = await createAccount(
        "lower-name",
        `lower-name-${run}@example.com`
      );

      const saved = await updateUserById(
        user.id,
        settings(user, { name: "Renamed" })
      );

      expect(saved.status).toBe(200);
      expect((await stored(user.id)).name).toBe("Renamed");
      await settle();
      expect(sendMail).not.toHaveBeenCalled();
    });

    it("treats its email typed with capitals as unchanged", async () => {
      const email = `lower-same-${run}@example.com`;
      const user = await createAccount("lower-same", email);

      const saved = await updateUserById(
        user.id,
        settings(user, { email: email.toUpperCase(), name: "Renamed" })
      );

      expect(saved.status).toBe(200);
      const after = await stored(user.id);
      expect(after.email).toBe(email);
      expect(after.unverifiedNewEmail).toBeNull();
      await settle();
      expect(sendMail).not.toHaveBeenCalled();
    });

    it("changes its email to a new one once the new one is verified", async () => {
      const user = await createAccount(
        "lower-change",
        `lower-change-${run}@example.com`
      );
      const newEmail = `lower-new-${run}@example.com`;
      emailsUsed.push(newEmail);

      const requested = await updateUserById(
        user.id,
        settings(user, { email: newEmail, password })
      );
      expect(requested.status).toBe(200);

      const mail = await waitForChangeMail(0);
      expect(mail.to).toBe(newEmail);

      const verified = await verify(mail.token);
      expect(verified.status).toBe(200);
      const after = await stored(user.id);
      expect(after.email).toBe(newEmail);
      expect(after.unverifiedNewEmail).toBeNull();
    });

    it("refuses a new email another account already has", async () => {
      const taken = await createAccount(
        "lower-taken",
        `lower-taken-${run}@example.com`
      );
      const user = await createAccount(
        "lower-taker",
        `lower-taker-${run}@example.com`
      );

      const requested = await updateUserById(
        user.id,
        settings(user, { email: taken.email, password })
      );

      expect(requested).toEqual({ response: "Email is taken.", status: 400 });
      await settle();
      expect(sendMail).not.toHaveBeenCalled();
    });
  });
});
