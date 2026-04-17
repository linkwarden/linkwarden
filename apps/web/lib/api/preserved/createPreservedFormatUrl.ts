import crypto from "crypto";
import { decode, encode, JWT } from "next-auth/jwt";
import getSuffixFromFormat from "@/lib/shared/getSuffixFromFormat";
import { ArchivedFormat } from "@linkwarden/types/global";

export const PRESERVED_FORMAT_SCOPE = "preserved-format";
export const PRESERVED_FORMAT_TOKEN_TTL_SECONDS = 300;

export type PreservedFormatToken = JWT & {
  scope: typeof PRESERVED_FORMAT_SCOPE;
  linkId: number;
  filePath: string;
  format: ArchivedFormat;
  iat: number;
  exp: number;
};

const getPreservedTokenSecret = () => {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not configured.");
  }

  return process.env.NEXTAUTH_SECRET;
};

const isPreservedFormatToken = (
  token: JWT | null
): token is PreservedFormatToken => {
  const suffix =
    typeof token?.format === "number" ? getSuffixFromFormat(token.format) : null;

  return (
    !!token &&
    token.scope === PRESERVED_FORMAT_SCOPE &&
    typeof token.linkId === "number" &&
    Number.isFinite(token.linkId) &&
    typeof token.filePath === "string" &&
    !!suffix &&
    token.filePath.endsWith(suffix) &&
    typeof token.format === "number" &&
    typeof token.iat === "number" &&
    typeof token.exp === "number"
  );
};

export default async function createPreservedFormatUrl({
  linkId,
  filePath,
  format,
}: {
  linkId: number;
  filePath: string;
  format: ArchivedFormat;
}) {
  const userContentDomain = process.env.NEXT_PUBLIC_USER_CONTENT_DOMAIN;
  if (!userContentDomain) {
    throw new Error("User content domain is not configured.");
  }

  const suffix = getSuffixFromFormat(format);
  if (!suffix || !filePath.endsWith(suffix)) {
    throw new Error("Invalid archived format.");
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await encode({
    secret: getPreservedTokenSecret(),
    maxAge: PRESERVED_FORMAT_TOKEN_TTL_SECONDS,
    token: {
      id: 0,
      scope: PRESERVED_FORMAT_SCOPE,
      linkId,
      filePath,
      format,
      iat: now,
      exp: now + PRESERVED_FORMAT_TOKEN_TTL_SECONDS,
      jti: crypto.randomUUID(),
    },
  });

  return `${userContentDomain}/api/v1/preserved/view?token=${encodeURIComponent(
    token
  )}`;
}

export async function decodePreservedFormatToken(token: string) {
  const decoded = await decode({
    token,
    secret: getPreservedTokenSecret(),
  }).catch(() => null);

  if (!isPreservedFormatToken(decoded)) {
    return null;
  }

  return decoded;
}
