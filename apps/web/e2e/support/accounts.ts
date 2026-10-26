import { APIRequestContext, Page, request } from "@playwright/test";
import fs from "fs";
import path from "path";

// Helpers for the email verification suite (e2e/tests/email). They need an
// instance with email enabled and EMAIL_SERVER pointing at support/mail-sink.mjs,
// whose directory is passed to the tests as E2E_MAIL_DIR.

export const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const mailDir = () => process.env.E2E_MAIL_DIR as string;

export const uniqueEmail = (label: string) =>
  `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@lab.test`;

export const newActor = () => request.newContext({ baseURL });

/** Decoded bodies of every message sent to this address, oldest first. */
export function messagesTo(email: string) {
  if (!fs.existsSync(mailDir())) return [];

  return fs
    .readdirSync(mailDir())
    .filter((file) => file.endsWith(".eml"))
    .sort()
    .map((file) => fs.readFileSync(path.join(mailDir(), file), "utf8"))
    .filter((raw) => raw.startsWith(`X-Rcpt: ${email}\r\n`))
    .map((raw) =>
      raw
        .replace(/=\r?\n/g, "")
        .replace(/=3D/g, "=")
        .replace(/&#x3D;/g, "=")
        .replace(/&amp;/g, "&")
        .replace(/\r/g, "")
    );
}

export async function waitForMessage(email: string, previousCount: number) {
  for (let i = 0; i < 60; i++) {
    const messages = messagesTo(email);
    if (messages.length > previousCount) return messages[messages.length - 1];
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No new email for ${email}`);
}

/** A verification email holds either a 6-digit code or a sign-in link. */
export function verificationFrom(message: string) {
  const code = message.match(/verification code(?: is|:)\s*(\d{6})/i)?.[1];
  const link = message.match(
    /https?:\/\/[^\s"<>]+\/(?:auth\/verify|api\/v1\/auth\/callback\/[a-z]+)\?[^\s"<>]+/
  )?.[0];

  return { code, link };
}

export async function csrfToken(actor: APIRequestContext) {
  return (await (await actor.get("/api/v1/auth/csrf")).json()).csrfToken;
}

/** Signs in through the NextAuth credentials provider; returns the error, or null. */
export async function credentialsLogin(
  actor: APIRequestContext,
  username: string,
  password: string,
  code?: string
) {
  const response = await actor.post("/api/v1/auth/callback/credentials", {
    form: {
      username,
      password,
      ...(code ? { code } : {}),
      csrfToken: await csrfToken(actor),
      callbackUrl: "/",
      json: "true",
    },
  });
  const url = new URL((await response.json()).url);

  return url.searchParams.get("error");
}

export async function currentUser(actor: APIRequestContext) {
  const response = await actor.get("/api/v1/users/me");
  return { status: response.status(), body: await response.json() };
}

export async function register(
  actor: APIRequestContext,
  data: { email: string; password?: string; name?: string; username?: string }
) {
  return actor.post("/api/v1/users", {
    data: { name: data.name ?? "E2E User", ...data },
  });
}

/** Asks NextAuth for an email link (magic link or invitation) to this address. */
export async function requestEmailLink(
  actor: APIRequestContext,
  provider: "email" | "invite",
  email: string
) {
  return actor.post(`/api/v1/auth/signin/${provider}`, {
    form: {
      email,
      csrfToken: await csrfToken(actor),
      callbackUrl: "/",
      json: "true",
    },
  });
}

/** Opens a link from an email; /auth/verify pages forward to the NextAuth email callback. */
export async function followEmailLink(actor: APIRequestContext, link: string) {
  const url = new URL(
    link.replace("/auth/verify?", "/api/v1/auth/callback/email?")
  );
  const response = await actor.get(url.pathname + url.search);
  return response.url();
}

/**
 * Finishes email verification for a password account the way a person would,
 * from whatever the latest email holds: a code entered with the password, or a link.
 */
export async function completeVerification(
  actor: APIRequestContext,
  email: string,
  password: string,
  message: string
) {
  const { code, link } = verificationFrom(message);

  if (code) return credentialsLogin(actor, email, password, code);
  if (link) {
    await followEmailLink(actor, link);
    return null;
  }
  throw new Error("Verification email has neither a code nor a link");
}

/** Same as completeVerification, in the browser. */
export async function completeVerificationInPage(page: Page, message: string) {
  const { code, link } = verificationFrom(message);

  if (code) {
    await page.getByTestId("verification-code-input").fill(code);
    await page.getByTestId("verify-email-button").click();
  } else if (link) {
    const url = new URL(
      link.replace("/auth/verify?", "/api/v1/auth/callback/email?")
    );
    await page.goto(url.pathname + url.search);
  } else throw new Error("Verification email has neither a code nor a link");
}

/** Signs in through the e2e OIDC provider as the given identity. */
export async function oidcSignIn(
  actor: APIRequestContext,
  identity: {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
  }
) {
  await fetch(`${process.env.E2E_OIDC_URL}/__identity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(identity),
  });

  const response = await actor.post("/api/v1/auth/signin/oidc", {
    form: { csrfToken: await csrfToken(actor), callbackUrl: "/", json: "true" },
  });
  const final = await actor.get((await response.json()).url);

  return new URL(final.url()).searchParams.get("error");
}
