import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { prisma } from "@linkwarden/prisma";
import {
  sendEmailVerificationCode,
  verifyEmailWithCode,
} from "@/lib/api/emailVerificationCode";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/emailVerificationCode", () => ({
  sendEmailVerificationCode: vi.fn(),
  verifyEmailWithCode: vi.fn(),
}));

const password = "AttackerPw1!";
const unverifiedUser = {
  id: 4,
  email: "victim@lab.test",
  username: "atk",
  emailVerified: null,
  password: bcrypt.hashSync(password, 4),
};

// emailEnabled is read when the module loads
const loadVerifyByCredentials = async () =>
  (await import("./verifyByCredentials")).default;

describe("verifyByCredentials with email enabled", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("EMAIL_FROM", "noreply@lab.test");
    vi.stubEnv("EMAIL_SERVER", "smtp://127.0.0.1:2525");
    vi.mocked(prisma.user.findFirst).mockResolvedValue(unverifiedUser as any);
    vi.mocked(sendEmailVerificationCode).mockResolvedValue({
      response: "Verification code sent.",
      status: 200,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("checks the password before revealing that the email is unverified", async () => {
    const verifyByCredentials = await loadVerifyByCredentials();

    const result = await verifyByCredentials({
      username: "victim@lab.test",
      password: "VictimsOwnPw9",
    });

    expect(result.status).toBe("invalid_credentials");
    expect(sendEmailVerificationCode).not.toHaveBeenCalled();
  });

  it("sends a code when the password is right but the email is unverified", async () => {
    const verifyByCredentials = await loadVerifyByCredentials();

    const result = await verifyByCredentials({
      username: "victim@lab.test",
      password,
    });

    expect(result.status).toBe("email_not_verified");
    expect(sendEmailVerificationCode).toHaveBeenCalledWith("victim@lab.test");
  });

  it("logs in once the password and code are both right", async () => {
    vi.mocked(verifyEmailWithCode).mockResolvedValue(null);
    const verifyByCredentials = await loadVerifyByCredentials();

    const result = await verifyByCredentials({
      username: "victim@lab.test",
      password,
      code: "123456",
    });

    expect(result.status).toBe("success");
    expect(verifyEmailWithCode).toHaveBeenCalledWith(unverifiedUser, "123456");
  });

  it("rejects a wrong code", async () => {
    vi.mocked(verifyEmailWithCode).mockResolvedValue(
      "Invalid or expired code."
    );
    const verifyByCredentials = await loadVerifyByCredentials();

    const result = await verifyByCredentials({
      username: "victim@lab.test",
      password,
      code: "000000",
    });

    expect(result).toEqual({
      status: "invalid_code",
      response: "Invalid or expired code.",
    });
  });

  it("never checks a code without the right password", async () => {
    const verifyByCredentials = await loadVerifyByCredentials();

    const result = await verifyByCredentials({
      username: "victim@lab.test",
      password: "VictimsOwnPw9",
      code: "123456",
    });

    expect(result.status).toBe("invalid_credentials");
    expect(verifyEmailWithCode).not.toHaveBeenCalled();
  });
});
