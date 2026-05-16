import { createSign } from "crypto";
import { readFileSync } from "fs";
import * as process from "process";

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

  if (!process.env.APPLE_PRIVATE_KEY_PATH)
    throw Error("Apple private key path is not configured.");

  applePrivateKey = readFileSync(process.env.APPLE_PRIVATE_KEY_PATH, "utf8");

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
  const signature = createSign("SHA256")
    .update(unsignedToken)
    .sign({
      key: getApplePrivateKey(),
      dsaEncoding: "ieee-p1363",
    });

  return {
    value: `${unsignedToken}.${base64UrlEncode(signature)}`,
    expiresAt,
  };
}

export function getAppleClientSecret() {
  if (
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY_PATH
  ) {
    const now = Math.floor(Date.now() / 1000);

    if (
      !appleClientSecret ||
      appleClientSecret.expiresAt - appleClientSecretRenewBuffer <= now
    ) {
      appleClientSecret = createAppleClientSecret();
    }

    return appleClientSecret.value;
  }

  const clientSecret =
    process.env.APPLE_CLIENT_SECRET || process.env.APPLE_SECRET;

  if (!clientSecret) throw Error("Apple client secret is not configured.");

  return clientSecret;
}
