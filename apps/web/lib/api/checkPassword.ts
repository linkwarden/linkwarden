import { prisma } from "@linkwarden/prisma";
import bcrypt from "bcrypt";

/**
 * Every password check for an account shares one counter: logging in, and the
 * prompts for changing the email or password and for deleting the account.
 * The first MAX_PASSWORD_RETRIES wrong passwords go through right away, then
 * each attempt has to wait PASSWORD_RETRY_DELAY after the last one. A correct
 * password resets the counter, and so does resetting or changing the password.
 */

export const MAX_PASSWORD_RETRIES = 15;
export const PASSWORD_RETRY_DELAY = 25 * 1000; // 25 seconds

export type PasswordCheck =
  | { status: "correct" }
  | { status: "incorrect" }
  | { status: "too_many_attempts"; response: string; retryAfter: number };

export default async function checkPassword(
  userId: number,
  hashedPassword: string,
  password: string
): Promise<PasswordCheck> {
  const now = Date.now();

  // Count the attempt before comparing, so parallel guesses can't get past the limit
  const { count } = await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [
        { passwordRetries: { lt: MAX_PASSWORD_RETRIES } },
        { passwordRetryAt: null },
        { passwordRetryAt: { lte: new Date(now - PASSWORD_RETRY_DELAY) } },
        // Only a clock that was off can leave a time this far ahead, so it shouldn't lock the account
        { passwordRetryAt: { gt: new Date(now + PASSWORD_RETRY_DELAY) } },
      ],
    },
    data: {
      passwordRetries: { increment: 1 },
      passwordRetryAt: new Date(now),
    },
  });

  if (count === 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordRetryAt: true },
    });

    // The account was deleted in the meantime
    if (!user) return { status: "incorrect" };

    const lastAttempt = user.passwordRetryAt?.getTime() ?? now;
    const retryAfter = Math.min(
      Math.max(Math.ceil((lastAttempt + PASSWORD_RETRY_DELAY - now) / 1000), 1),
      PASSWORD_RETRY_DELAY / 1000
    );

    return {
      status: "too_many_attempts",
      response: `Too many incorrect passwords. Please try again in ${retryAfter} second${
        retryAfter === 1 ? "" : "s"
      }.`,
      retryAfter,
    };
  }

  if (!bcrypt.compareSync(password, hashedPassword))
    return { status: "incorrect" };

  await prisma.user.updateMany({
    where: { id: userId },
    data: { passwordRetries: 0, passwordRetryAt: null },
  });

  return { status: "correct" };
}
