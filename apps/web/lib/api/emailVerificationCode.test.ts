import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@linkwarden/prisma";
import sendVerificationRequest from "@/lib/api/sendVerificationRequest";
import {
  sendEmailVerificationCode,
  verifyEmailWithCode,
} from "./emailVerificationCode";

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    emailVerificationCode: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/api/sendVerificationRequest", () => ({
  default: vi.fn(),
}));

const minutes = (n: number) => n * 60 * 1000;
const user = { id: 3, email: "victim@lab.test" };

// Sends a code through the mocked mailer and returns the plaintext it emailed
const issueCode = async () => {
  vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue(null);
  await sendEmailVerificationCode(user.email);
  const { code } = vi.mocked(sendVerificationRequest).mock.calls[0][0];
  const stored = vi.mocked(prisma.emailVerificationCode.upsert).mock.calls[0][0]
    .create as { identifier: string; code: string; expires: Date };
  vi.clearAllMocks();
  return { code, stored };
};

describe("emailVerificationCode", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("emails a 6-digit code and stores only its hash", async () => {
    const { code, stored } = await issueCode();

    expect(code).toMatch(/^\d{6}$/);
    expect(stored.identifier).toBe("victim@lab.test");
    expect(stored.code).not.toContain(code);
    expect(stored.expires.getTime()).toBeGreaterThan(Date.now() + minutes(19));
  });

  it("refuses to resend within a minute of the last code", async () => {
    vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue({
      identifier: user.email,
      code: "hash",
      attempts: 0,
      expires: new Date(Date.now() + minutes(19.5)),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await sendEmailVerificationCode(user.email);

    expect(result.status).toBe(429);
    expect(sendVerificationRequest).not.toHaveBeenCalled();
  });

  it("keeps counting failed attempts across resends", async () => {
    vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue({
      identifier: user.email,
      code: "hash",
      attempts: 3,
      expires: new Date(Date.now() - minutes(1)),
      createdAt: new Date(Date.now() - minutes(30)),
      updatedAt: new Date(),
    });

    await sendEmailVerificationCode(user.email);

    const { update } = vi.mocked(prisma.emailVerificationCode.upsert).mock
      .calls[0][0];
    expect(update).not.toHaveProperty("attempts");
  });

  it("stops sending codes once the attempt limit is reached", async () => {
    vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue({
      identifier: user.email,
      code: "hash",
      attempts: 10,
      expires: new Date(Date.now() - minutes(1)),
      createdAt: new Date(Date.now() - minutes(30)),
      updatedAt: new Date(),
    });

    const result = await sendEmailVerificationCode(user.email);

    expect(result.status).toBe(429);
    expect(sendVerificationRequest).not.toHaveBeenCalled();
  });

  it("resets the attempt count after an hour", async () => {
    vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue({
      identifier: user.email,
      code: "hash",
      attempts: 10,
      expires: new Date(Date.now() - minutes(1)),
      createdAt: new Date(Date.now() - minutes(61)),
      updatedAt: new Date(),
    });

    const result = await sendEmailVerificationCode(user.email);

    expect(result.status).toBe(200);
    const { update } = vi.mocked(prisma.emailVerificationCode.upsert).mock
      .calls[0][0];
    expect(update).toMatchObject({ attempts: 0 });
  });

  it("puts back the last code when the email can't be sent", async () => {
    const existing = {
      identifier: user.email,
      code: "previous-hash",
      attempts: 2,
      expires: new Date(Date.now() + minutes(5)),
      createdAt: new Date(Date.now() - minutes(15)),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue(
      existing
    );
    vi.mocked(sendVerificationRequest).mockRejectedValueOnce(
      new Error("Email (victim@lab.test) could not be sent")
    );

    const result = await sendEmailVerificationCode(user.email);

    expect(result.status).toBe(500);
    // With the old expiry, the resend cooldown counts from the last real send
    expect(prisma.emailVerificationCode.updateMany).toHaveBeenCalledWith({
      where: { identifier: user.email },
      data: { code: existing.code, expires: existing.expires },
    });
  });

  it("doesn't keep a code it couldn't send to a new address", async () => {
    vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue(null);
    vi.mocked(sendVerificationRequest).mockRejectedValueOnce(
      new Error("Email (victim@lab.test) could not be sent")
    );

    const result = await sendEmailVerificationCode(user.email);

    expect(result.status).toBe(500);
    expect(prisma.emailVerificationCode.deleteMany).toHaveBeenCalledWith({
      where: { identifier: user.email },
    });
  });

  it("verifies the email with the right code", async () => {
    const { code, stored } = await issueCode();
    vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue({
      ...stored,
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.emailVerificationCode.updateMany).mockResolvedValue({
      count: 1,
    });

    expect(await verifyEmailWithCode(user, code)).toBeNull();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { emailVerified: expect.any(Date) },
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("rejects a wrong code and counts the attempt", async () => {
    const { code, stored } = await issueCode();
    vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue({
      ...stored,
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.emailVerificationCode.updateMany).mockResolvedValue({
      count: 1,
    });

    const wrongCode = code === "000000" ? "000001" : "000000";

    expect(await verifyEmailWithCode(user, wrongCode)).toBe(
      "Invalid or expired code."
    );
    expect(prisma.emailVerificationCode.updateMany).toHaveBeenCalledWith({
      where: { identifier: user.email, attempts: { lt: 10 } },
      data: { attempts: { increment: 1 } },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects even the right code once the attempt limit is reached", async () => {
    const { code, stored } = await issueCode();
    vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue({
      ...stored,
      attempts: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.emailVerificationCode.updateMany).mockResolvedValue({
      count: 0,
    });

    expect(await verifyEmailWithCode(user, code)).toBe(
      "Too many incorrect codes. Please try again later."
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects an expired code", async () => {
    const { code, stored } = await issueCode();
    vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue({
      ...stored,
      expires: new Date(Date.now() - 1000),
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(await verifyEmailWithCode(user, code)).toBe(
      "Invalid or expired code."
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects a code that isn't a string without counting an attempt", async () => {
    for (const code of [["123456"], { code: "123456" }, 123456, true])
      expect(await verifyEmailWithCode(user, code as any)).toBe(
        "Invalid or expired code."
      );

    expect(prisma.emailVerificationCode.updateMany).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("doesn't accept a code issued for another email", async () => {
    const { code, stored } = await issueCode();
    vi.mocked(prisma.emailVerificationCode.findUnique).mockResolvedValue({
      ...stored,
      identifier: "attacker@lab.test",
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.emailVerificationCode.updateMany).mockResolvedValue({
      count: 1,
    });

    expect(
      await verifyEmailWithCode({ id: 4, email: "attacker@lab.test" }, code)
    ).toBe("Invalid or expired code.");
  });
});
