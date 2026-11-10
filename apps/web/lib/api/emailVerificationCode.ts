import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@linkwarden/prisma";
import sendVerificationRequest from "@/lib/api/sendVerificationRequest";

/**
 * Email verification uses a 6-digit code that has to be entered together with
 * the account's password (see the credentials provider and the session API).
 * A link alone isn't enough: whoever registered the address set the password,
 * but only the owner of the inbox can read the code, so a stranger who signed
 * up with someone else's email can never get the account verified.
 */

const CODE_TTL = 20 * 60 * 1000; // 20 minutes
const RESEND_COOLDOWN = 60 * 1000; // 1 minute

const ATTEMPT_WINDOW = 3600 * 1000; // 1 hour
const MAX_ATTEMPTS = 10;

const hashCode = (identifier: string, code: string) =>
  createHmac("sha256", process.env.NEXTAUTH_SECRET as string)
    .update(`${identifier}:${code}`)
    .digest("hex");

export async function sendEmailVerificationCode(email: string) {
  const identifier = email.toLowerCase();
  const now = Date.now();

  const existing = await prisma.emailVerificationCode.findUnique({
    where: { identifier },
  });

  // The last code was sent CODE_TTL before it expires
  if (existing && existing.expires.getTime() - CODE_TTL + RESEND_COOLDOWN > now)
    return {
      response: "Please wait a minute before requesting a new code.",
      status: 429,
    };

  const windowExpired =
    !existing || existing.createdAt.getTime() + ATTEMPT_WINDOW < now;

  if (!windowExpired && existing.attempts >= MAX_ATTEMPTS)
    return {
      response: "Too many incorrect codes. Please try again later.",
      status: 429,
    };

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const data = {
    code: hashCode(identifier, code),
    expires: new Date(now + CODE_TTL),
  };

  await prisma.emailVerificationCode.upsert({
    where: { identifier },
    create: { identifier, ...data },
    update: windowExpired
      ? { ...data, attempts: 0, createdAt: new Date(now) }
      : data,
  });

  try {
    await sendVerificationRequest({ identifier, code });
  } catch (error) {
    console.error("Could not send verification code:", error);

    // Nothing was sent, so restore the last code and its resend cooldown
    if (existing)
      await prisma.emailVerificationCode.updateMany({
        where: { identifier },
        data: { code: existing.code, expires: existing.expires },
      });
    else
      await prisma.emailVerificationCode.deleteMany({ where: { identifier } });

    return {
      response:
        "The verification email couldn't be sent. Please try again later.",
      status: 500,
    };
  }

  return { response: "Verification code sent.", status: 200 };
}

/**
 * Checks the code for an unverified user and marks their email as verified.
 * Returns an error message, or null on success.
 */
export async function verifyEmailWithCode(
  user: { id: number; email: string | null },
  code: string
) {
  // NextAuth also accepts JSON bodies, so the code isn't guaranteed to be a string
  if (!user.email || typeof code !== "string")
    return "Invalid or expired code.";

  const identifier = user.email.toLowerCase();

  const existing = await prisma.emailVerificationCode.findUnique({
    where: { identifier },
  });

  if (!existing || existing.expires < new Date())
    return "Invalid or expired code.";

  // Count the attempt before comparing, so parallel guesses can't exceed the limit
  const { count } = await prisma.emailVerificationCode.updateMany({
    where: { identifier, attempts: { lt: MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });

  if (count === 0) return "Too many incorrect codes. Please try again later.";

  const a = new TextEncoder().encode(existing.code);
  const b = new TextEncoder().encode(hashCode(identifier, code.trim()));

  if (a.length !== b.length || !timingSafeEqual(a, b))
    return "Invalid or expired code.";

  await prisma.$transaction([
    prisma.emailVerificationCode.deleteMany({ where: { identifier } }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
  ]);

  return null;
}
