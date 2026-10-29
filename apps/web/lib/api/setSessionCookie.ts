import { NextApiResponse } from "next";
import { JWT, encode } from "next-auth/jwt";

export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://");
const cookieName = `${
  useSecureCookies ? "__Secure-" : ""
}next-auth.session-token`;

// Writes the web session cookie the same way next-auth does, for routes outside next-auth that need to replace it
export default async function setSessionCookie(
  res: NextApiResponse,
  token: JWT
) {
  const sessionToken = await encode({
    token,
    maxAge: SESSION_MAX_AGE,
    secret: process.env.NEXTAUTH_SECRET as string,
  });

  const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  res.setHeader(
    "Set-Cookie",
    `${cookieName}=${sessionToken}; Path=/; Expires=${expires.toUTCString()}; HttpOnly; SameSite=Lax${
      useSecureCookies ? "; Secure" : ""
    }`
  );
}
