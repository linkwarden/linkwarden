import { NextApiRequest, NextApiResponse } from "next";
import { JWT, encode } from "next-auth/jwt";

export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// Same check as getToken, which reads the cookie back
const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") ?? !!process.env.VERCEL;
const cookieName = `${
  useSecureCookies ? "__Secure-" : ""
}next-auth.session-token`;

// Browsers ignore cookies over 4096 bytes, so like next-auth, a bigger session is split into chunks
const CHUNK_SIZE = 4096 - 163;

const serialize = (name: string, value: string, expiry: string) =>
  `${name}=${value}; Path=/; ${expiry}; HttpOnly; SameSite=Lax${
    useSecureCookies ? "; Secure" : ""
  }`;

// Writes the web session cookie the same way next-auth does, for routes outside next-auth that need to replace it
export default async function setSessionCookie(
  req: NextApiRequest,
  res: NextApiResponse,
  token: JWT
) {
  const sessionToken = await encode({
    token,
    maxAge: SESSION_MAX_AGE,
    secret: process.env.NEXTAUTH_SECRET as string,
  });

  const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  const cookies: Record<string, string> = {};

  // The old session may have been split into a different number of chunks, so clear all of them
  for (const name in req.cookies)
    if (name.startsWith(cookieName))
      cookies[name] = serialize(name, "", "Max-Age=0");

  const chunkCount = Math.ceil(sessionToken.length / CHUNK_SIZE);

  for (let i = 0; i < chunkCount; i++) {
    const name = chunkCount === 1 ? cookieName : `${cookieName}.${i}`;

    cookies[name] = serialize(
      name,
      sessionToken.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      `Expires=${expires.toUTCString()}`
    );
  }

  res.setHeader("Set-Cookie", Object.values(cookies));
}
