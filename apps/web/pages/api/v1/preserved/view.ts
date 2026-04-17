import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { readFile } from "@linkwarden/filesystem";
import {
  decodePreservedFormatToken,
  PRESERVED_FORMAT_SCOPE,
} from "@/lib/api/preserved/createPreservedFormatUrl";
import { ArchivedFormat } from "@linkwarden/types/global";

const getSingleValue = (value?: string | string[]) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const normalizeHost = (value: string, protocol = "https:") => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const urlValue = trimmed.includes("://") ? trimmed : `${protocol}//${trimmed}`;

  try {
    const parsed = new URL(urlValue);
    const hostname = parsed.hostname.toLowerCase();
    const port = parsed.port;
    const isDefaultPort =
      !port ||
      (parsed.protocol === "https:" && port === "443") ||
      (parsed.protocol === "http:" && port === "80");

    return isDefaultPort ? hostname : `${hostname}:${port}`;
  } catch {
    return null;
  }
};

const getForwardedHeaderValue = (forwarded?: string | string[], key?: string) => {
  const headerValue = getSingleValue(forwarded);
  if (!headerValue || !key) return undefined;

  const firstEntry = headerValue.split(",")[0];
  const match = firstEntry.match(
    new RegExp(`(?:^|;)\\s*${key}=("[^"]+"|[^;]+)`, "i")
  );

  return match?.[1]?.replace(/^"|"$/g, "").trim();
};

const getRequestHost = (req: NextApiRequest, protocol: string) => {
  const forwardedHost = getSingleValue(req.headers["x-forwarded-host"]);
  if (forwardedHost) {
    return normalizeHost(forwardedHost.split(",")[0], protocol);
  }

  const forwardedHeaderHost = getForwardedHeaderValue(
    req.headers.forwarded,
    "host"
  );
  if (forwardedHeaderHost) {
    return normalizeHost(forwardedHeaderHost, protocol);
  }

  const host = getSingleValue(req.headers.host);
  if (!host) return null;

  return normalizeHost(host, protocol);
};

const getDownloadFilename = (
  format: ArchivedFormat,
  filePath: string
) => {
  const suffix = path.posix.extname(filePath) || "";

  switch (format) {
    case ArchivedFormat.monolith:
      return "Webpage.html";
    case ArchivedFormat.pdf:
      return "PDF.pdf";
    case ArchivedFormat.png:
    case ArchivedFormat.jpeg:
      return `Screenshot${suffix}`;
    case ArchivedFormat.readability:
      return "Readable.json";
    default:
      return path.posix.basename(filePath);
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ response: "Method not allowed" });
  }

  const userContentOrigin = process.env.NEXT_PUBLIC_USER_CONTENT_DOMAIN;
  if (!userContentOrigin) {
    return res
      .status(400)
      .json({ response: "User content domain is not configured." });
  }

  const userContentUrl = new URL(userContentOrigin);
  const userContentHost = normalizeHost(
    userContentUrl.host,
    userContentUrl.protocol
  );
  if (
    !userContentHost ||
    getRequestHost(req, userContentUrl.protocol) !== userContentHost
  ) {
    return res.status(403).json({ response: "Invalid user content host." });
  }

  try {
    const encodedToken = getSingleValue(req.query.token);
    if (!encodedToken) {
      return res.status(401).json({ response: "Missing archived format token." });
    }

    const token = await decodePreservedFormatToken(encodedToken);
    if (
      !token ||
      token.scope !== PRESERVED_FORMAT_SCOPE ||
      token.exp <= Math.floor(Date.now() / 1000)
    ) {
      return res.status(401).json({ response: "Invalid archived format token." });
    }

    const { file, contentType, status } = await readFile(token.filePath);
    if (status !== 200) {
      return res.status(status as number).send(file);
    }

    res
      .setHeader(
        "Content-Type",
        contentType === "text/html"
          ? "text/html; charset=utf-8"
          : contentType
      )
      .setHeader("Cache-Control", "private, no-store")
      .setHeader("X-Robots-Tag", "noindex, nofollow");

    if (getSingleValue(req.query.download) === "1") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${getDownloadFilename(
          token.format,
          token.filePath
        )}"`
      );
    }

    return res.status(200).send(file);
  } catch (error: any) {
    return res.status(500).json({
      response: error?.message || "Failed to load archived format.",
    });
  }
}
