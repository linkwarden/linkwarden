import { NextApiRequest } from "next";
import { JWT, getToken } from "next-auth/jwt";

// next-auth's getToken reads the session cookie before the Authorization
// header, so a stale cookie (e.g. one sitting in a mobile client's native
// cookie jar) silently outranks the Bearer token an API client explicitly
// sends. When a Bearer token is present, resolve the request from it alone;
// cookie-based auth stays untouched for requests without one (the web app).
export default async function getTokenFromRequest(
  req: NextApiRequest
): Promise<JWT | null> {
  const authorization = req.headers.authorization;

  if (authorization?.startsWith("Bearer "))
    return getToken({
      req: { headers: { authorization }, cookies: {} } as NextApiRequest,
    });

  return getToken({ req });
}
