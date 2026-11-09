import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sendChangeEmailVerificationRequest from "./sendChangeEmailVerificationRequest";
import { prisma } from "@linkwarden/prisma";
import transporter from "@linkwarden/lib/transporter";

vi.mock("@linkwarden/prisma", () => {
  const prisma: any = {
    user: {
      update: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
  prisma.$transaction = vi.fn((fn: any) => fn(prisma));

  return { prisma };
});

vi.mock("@linkwarden/lib/transporter", () => ({
  default: { sendMail: vi.fn() },
}));

vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  readFileSync: vi.fn(() => "{{{url}}}"),
}));

describe("sendChangeEmailVerificationRequest", () => {
  beforeEach(() => {
    vi.stubEnv("BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("issues a token for the old email as stored and mails it to the new email", async () => {
    // An older account's email can be stored with capitals, and the
    // verification finds the account by the token's identifier
    await sendChangeEmailVerificationRequest(
      "Old@Example.com",
      "New@Example.com",
      "User"
    );

    const { data } = vi.mocked(prisma.verificationToken.create).mock
      .calls[0][0] as any;

    expect(data.identifier).toBe("Old@Example.com");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "Old@Example.com" },
      data: { unverifiedNewEmail: "new@example.com" },
    });
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "Old@Example.com" },
    });

    const mail = vi.mocked(transporter.sendMail).mock.calls[0][0] as any;

    expect(mail.to).toBe("New@Example.com");
    expect(mail.html).toBe(
      `http://localhost:3000/auth/verify-email?token=${data.token}`
    );
  });

  it("invalidates tokens from earlier email change requests", async () => {
    await sendChangeEmailVerificationRequest(
      "old@example.com",
      "new@example.com",
      "User"
    );

    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "old@example.com" },
    });

    const [deleteOrder] = vi.mocked(prisma.verificationToken.deleteMany).mock
      .invocationCallOrder;
    const [createOrder] = vi.mocked(prisma.verificationToken.create).mock
      .invocationCallOrder;

    expect(deleteOrder).toBeLessThan(createOrder);
  });

  it("updates the pending email before touching tokens", async () => {
    await sendChangeEmailVerificationRequest(
      "old@example.com",
      "new@example.com",
      "User"
    );

    const [updateOrder] = vi.mocked(prisma.user.update).mock
      .invocationCallOrder;
    const [deleteOrder] = vi.mocked(prisma.verificationToken.deleteMany).mock
      .invocationCallOrder;

    expect(updateOrder).toBeLessThan(deleteOrder);
  });
});
