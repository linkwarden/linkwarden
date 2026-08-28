import { createSign } from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import * as process from "process";
import readSecret from "./readSecret";

const appleIssuer = "https://appleid.apple.com";
const appleJwks = createRemoteJWKSet(new URL(`${appleIssuer}/auth/keys`));

const appleClientSecretMaxAge = 60 * 60 * 24 * 30; // 30 days
const appleClientSecretRenewBuffer = 60 * 60; // 1 hour
let appleClientSecret:
  | {
      value: string;
      expiresAt: number;
    }
  | undefined;
let applePrivateKey: string | undefined;

export function getAppleClientId() {
  const clientId = process.env.APPLE_CLIENT_ID || process.env.APPLE_ID;

  if (!clientId) throw Error("Apple client ID is not configured.");

  return clientId;
}

function getApplePrivateKey() {
  if (applePrivateKey) return applePrivateKey;

  const privateKey = readSecret(process.env.APPLE_PRIVATE_KEY);

  if (!privateKey) throw Error("Apple private key is not configured.");

  applePrivateKey = privateKey;

  return applePrivateKey;
}

function base64UrlEncode(value: Buffer | Record<string, any>) {
  const input = Buffer.isBuffer(value)
    ? value
    : Buffer.from(JSON.stringify(value));

  return input.toString("base64url");
}

function createAppleClientSecret() {
  if (!process.env.APPLE_TEAM_ID)
    throw Error("Apple team ID is not configured.");

  if (!process.env.APPLE_KEY_ID) throw Error("Apple key ID is not configured.");

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + appleClientSecretMaxAge;
  const payload = {
    iss: process.env.APPLE_TEAM_ID,
    iat: now,
    exp: expiresAt,
    aud: "https://appleid.apple.com",
    sub: getAppleClientId(),
  };
  const header = {
    alg: "ES256",
    kid: process.env.APPLE_KEY_ID,
  };
  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(
    payload
  )}`;
  const signature = createSign("SHA256").update(unsignedToken).sign({
    key: getApplePrivateKey(),
    dsaEncoding: "ieee-p1363",
  });

  return {
    value: `${unsignedToken}.${base64UrlEncode(signature)}`,
    expiresAt,
  };
}

export async function verifyAppleIdentityToken(
  identityToken: string,
  audience: string
) {
  const { payload } = await jwtVerify(identityToken, appleJwks, {
    issuer: appleIssuer,
    audience,
  });

  if (!payload.sub) throw Error("Apple identity token is missing the subject.");

  return payload as {
    sub: string;
    email?: string;
    email_verified?: boolean | string;
    is_private_email?: boolean | string;
  };
}

export function parseAppleSignupName(body: any): string | undefined {
  if (typeof body?.user !== "string") return undefined;

  try {
    const user = JSON.parse(body.user);
    const name = [user?.name?.firstName, user?.name?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return name || undefined;
  } catch {
    return undefined;
  }
}

export function getAppleClientSecret() {
  const now = Math.floor(Date.now() / 1000);

  if (
    !appleClientSecret ||
    appleClientSecret.expiresAt - appleClientSecretRenewBuffer <= now
  ) {
    appleClientSecret = createAppleClientSecret();
  }

  return appleClientSecret.value;
}
