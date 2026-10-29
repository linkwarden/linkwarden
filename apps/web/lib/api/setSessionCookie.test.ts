import { afterEach, describe, expect, it, vi } from "vitest";
import { decode } from "next-auth/jwt";

const SECRET = "set-session-cookie-test-secret";

const loadSetSessionCookie = async (nextAuthUrl: string) => {
  vi.stubEnv("NEXTAUTH_SECRET", SECRET);
  vi.stubEnv("NEXTAUTH_URL", nextAuthUrl);
  vi.resetModules();

  return await import("./setSessionCookie");
};

const writeCookie = async (nextAuthUrl: string) => {
  const { default: setSessionCookie, SESSION_MAX_AGE } =
    await loadSetSessionCookie(nextAuthUrl);
  const headers: Record<string, string> = {};

  await setSessionCookie(
    {
      setHeader: (name: string, value: string) => (headers[name] = value),
    } as any,
    { id: 1, sub: 1, sessionId: "session-id", sessionVersion: 2 } as any
  );

  return { cookie: headers["Set-Cookie"], SESSION_MAX_AGE };
};

describe("setSessionCookie", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("writes an httpOnly session cookie that next-auth can read back", async () => {
    const { cookie, SESSION_MAX_AGE } = await writeCookie(
      "http://localhost:3000/api/v1/auth"
    );

    const [pair, ...attributes] = cookie.split("; ");
    const [name, value] = pair.split("=");

    expect(name).toBe("next-auth.session-token");
    expect(attributes).toEqual(
      expect.arrayContaining(["Path=/", "HttpOnly", "SameSite=Lax"])
    );
    expect(attributes).not.toContain("Secure");

    const token = await decode({ token: value, secret: SECRET });
    expect(token).toMatchObject({
      id: 1,
      sessionId: "session-id",
      sessionVersion: 2,
    });
    expect(token!.exp - token!.iat).toBe(SESSION_MAX_AGE);
  });

  it("uses the secure cookie over https", async () => {
    const { cookie } = await writeCookie("https://example.com/api/v1/auth");

    expect(cookie.startsWith("__Secure-next-auth.session-token=")).toBe(true);
    expect(cookie.split("; ")).toContain("Secure");
  });
});
