import fetch, { RequestInit, Response } from "node-fetch";
import http from "http";
import https from "https";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import {
  assertUrlIsSafeForServerSideFetch,
  defaultHostnameLookup,
  resolveHostnameForServerSideFetch,
} from "@linkwarden/lib/ssrf";

type SafeFetchOptions = Omit<RequestInit, "agent" | "redirect"> & {
  maxRedirects?: number;
};

function createSafeLookup() {
  const lookup: any = (
    hostname: string,
    options: number | { family?: number | string; all?: boolean },
    callback: (
      error: NodeJS.ErrnoException | null,
      addressOrAddresses?:
        | string
        | ReadonlyArray<{ address: string; family: 4 | 6 }>,
      family?: number
    ) => void
  ) => {
    const normalizedOptions =
      typeof options === "number" ? { family: options } : options ?? {};
    const requestedFamily =
      normalizedOptions.family === "IPv4"
        ? 4
        : normalizedOptions.family === "IPv6"
          ? 6
          : normalizedOptions.family;

    resolveHostnameForServerSideFetch(hostname, defaultHostnameLookup)
      .then((resolved) => {
        if (normalizedOptions.all) {
          callback(null, resolved);
          return;
        }

        const match =
          resolved.find(
            (entry) => !requestedFamily || entry.family === requestedFamily
          ) ?? resolved[0];

        callback(null, match.address, match.family);
      })
      .catch((error) => {
        callback(error as NodeJS.ErrnoException);
      });
  };

  return lookup;
}

// Agents are cached at module level so connections are reused across
// requests (keep-alive). Creating a new Agent per request forces a fresh
// TCP+TLS handshake for every fetch, which on pages with dozens of
// subresources adds 15-25s and pushes page.goto past its navigation
// timeout. Connection reuse also cannot be affected by DNS rebinding,
// since no re-resolution happens on a reused socket.
let cachedProxyAgent: HttpsProxyAgent<string> | SocksProxyAgent | undefined;
let cachedHttpAgent: http.Agent | undefined;
let cachedHttpsAgent: https.Agent | undefined;

function createAgent(target: URL) {
  if (process.env.PROXY) {
    if (!cachedProxyAgent) {
      const proxy = new URL(process.env.PROXY);

      if (process.env.PROXY_USERNAME) {
        proxy.username = process.env.PROXY_USERNAME;
        proxy.password = process.env.PROXY_PASSWORD || "";
      }

      const ProxyAgent = proxy.protocol.includes("http")
        ? HttpsProxyAgent
        : SocksProxyAgent;

      cachedProxyAgent = new ProxyAgent(proxy.toString());
    }

    return cachedProxyAgent;
  }

  if (target.protocol === "http:") {
    if (!cachedHttpAgent) {
      cachedHttpAgent = new http.Agent({
        lookup: createSafeLookup(),
        keepAlive: true,
        maxSockets: 8,
      });
    }

    return cachedHttpAgent;
  }

  if (!cachedHttpsAgent) {
    cachedHttpsAgent = new https.Agent({
      lookup: createSafeLookup(),
      keepAlive: true,
      maxSockets: 8,
      rejectUnauthorized:
        process.env.ALLOW_INSECURE_TLS === "true" ||
        process.env.IGNORE_UNAUTHORIZED_CA === "true"
          ? false
          : true,
    });
  }

  return cachedHttpsAgent;
}

function isRedirectStatus(status: number) {
  return status >= 300 && status < 400;
}

export async function safeFetch(
  input: string,
  options: SafeFetchOptions = {}
): Promise<Response> {
  const { maxRedirects = 5, ...fetchOptions } = options;

  let currentUrl = input;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    const validatedUrl = await assertUrlIsSafeForServerSideFetch(currentUrl);
    const response = await fetch(validatedUrl.toString(), {
      ...fetchOptions,
      headers: {
        "User-Agent": "Linkwarden (Server-Side Fetch)",
        ...fetchOptions.headers,
      },
      agent: createAgent(validatedUrl),
      redirect: "manual",
    });

    if (!isRedirectStatus(response.status)) {
      return response;
    }

    const location = response.headers.get("location");

    if (!location) {
      return response;
    }

    currentUrl = new URL(location, validatedUrl).toString();
  }

  throw new Error("Fetch redirected too many times.");
}
