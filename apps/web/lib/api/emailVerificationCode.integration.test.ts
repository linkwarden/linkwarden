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
// Postgres handles parallel requests. The mailer is mocked, so nothing is sent.

vi.mock("@/lib/api/sendVerificationRequest", () => ({
  default: vi.fn(),
}));

let prisma: typeof import("@linkwarden/prisma").prisma;
let sendVerificationRequest: typeof import("@/lib/api/sendVerificationRequest").default;
let codes: typeof import("./emailVerificationCode");
let verifyByCredentials: typeof import("./verifyByCredentials").default;

const password = "E2ePassw0rd!";
const createdEmails: string[] = [];

const uniqueEmail = (label: string) => {
  const email = `${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}@lab.test`;
  createdEmails.push(email);
  return email;
};

const createUnverifiedUser = (email: string) =>
  prisma.user.create({
    data: {
      email,
      username: email.split("@")[0],
      password: bcrypt.hashSync(password, 4),
    },
  });

// The plaintext codes the mocked mailer was asked to send to this address
const sentCodes = (email: string) =>
  vi
    .mocked(sendVerificationRequest)
    .mock.calls.filter(([params]) => params.identifier === email)
    .map(([params]) => params.code);

describe.skipIf(!process.env.DATABASE_URL)(
  "email verification codes with a real database",
  () => {
    beforeAll(async () => {
      // emailEnabled is read when verifyByCredentials loads
      vi.stubEnv("EMAIL_FROM", "e2e@lab.test");
      vi.stubEnv("EMAIL_SERVER", "smtp://127.0.0.1:1");
      vi.stubEnv("NEXTAUTH_SECRET", "integration-secret");

      prisma = (await import("@linkwarden/prisma")).prisma;
      sendVerificationRequest = (
        await import("@/lib/api/sendVerificationRequest")
      ).default;
      codes = await import("./emailVerificationCode");
      verifyByCredentials = (await import("./verifyByCredentials")).default;
    });

    afterEach(async () => {
      const emails = createdEmails.splice(0, createdEmails.length);
      await prisma.emailVerificationCode.deleteMany({
        where: { identifier: { in: emails } },
      });
      await prisma.user.deleteMany({ where: { email: { in: emails } } });
      vi.mocked(sendVerificationRequest).mockClear();
    });

    afterAll(async () => {
      vi.unstubAllEnvs();
      await prisma.$disconnect();
    });

    it("verifies an account with the password and the emailed code", async () => {
      const email = uniqueEmail("db-verify");
      const user = await createUnverifiedUser(email);

      expect(
        (await verifyByCredentials({ username: email, password })).status
      ).toBe("email_not_verified");
      const [code] = sentCodes(email);

      expect(
        (await verifyByCredentials({ username: email, password, code })).status
      ).toBe("success");

      const after = await prisma.user.findUnique({ where: { id: user.id } });
      expect(after?.emailVerified).not.toBeNull();
      expect(
        await prisma.emailVerificationCode.findUnique({
          where: { identifier: email },
        })
      ).toBeNull();
    });

    it("handles parallel requests for a new address without a database error", async () => {
      const email = uniqueEmail("db-parallel-send");
      await createUnverifiedUser(email);

      const results = await Promise.all(
        Array.from({ length: 5 }, () => codes.sendEmailVerificationCode(email))
      );

      expect(results.some((result) => result.status === 200)).toBe(true);
      expect(
        await prisma.emailVerificationCode.count({
          where: { identifier: email },
        })
      ).toBe(1);
    });

    it("counts parallel wrong guesses against the limit exactly once each", async () => {
      const email = uniqueEmail("db-parallel-guess");
      const user = await createUnverifiedUser(email);
      await codes.sendEmailVerificationCode(email);
      const [code] = sentCodes(email);

      const errors = await Promise.all(
        Array.from({ length: 25 }, (_, i) =>
          codes.verifyEmailWithCode(
            user,
            String((Number(code) + i + 1) % 1000000).padStart(6, "0")
          )
        )
      );

      expect(
        errors.filter((e) => e === "Invalid or expired code.")
      ).toHaveLength(10);
      expect(
        (
          await prisma.emailVerificationCode.findUnique({
            where: { identifier: email },
          })
        )?.attempts
      ).toBe(10);
      expect(await codes.verifyEmailWithCode(user, code)).toBe(
        "Too many incorrect codes. Please try again later."
      );
    });
  }
);
