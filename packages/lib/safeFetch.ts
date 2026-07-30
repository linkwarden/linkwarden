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

// Module-level cached agents with keepAlive to allow socket reuse across
// requests. This avoids creating a new agent (and new OS socket) for every
// subresource fetched during archival, which was causing DNS bursts on
// rate-limiting resolvers (see issue #1747).
const agentCache: Record<string, http.Agent | https.Agent> = {};

function getOrCreateAgent(
  target: URL,
  lookup: ReturnType<typeof createSafeLookup> | undefined
): http.Agent | https.Agent {
  const cacheKey = `${target.protocol}:${lookup ? "safe" : "plain"}:${
    process.env.ALLOW_INSECURE_TLS
  }:${process.env.IGNORE_UNAUTHORIZED_CA}`;

  if (agentCache[cacheKey]) {
    return agentCache[cacheKey];
  }

  const agentOptions = { keepAlive: true, maxSockets: 8 };

  let agent: http.Agent | https.Agent;

  if (target.protocol === "http:") {
    agent = lookup
      ? new http.Agent({ ...agentOptions, lookup })
      : new http.Agent(agentOptions);
  } else {
    agent = new https.Agent({
      ...agentOptions,
      ...(lookup ? { lookup } : {}),
      rejectUnauthorized:
        process.env.ALLOW_INSECURE_TLS === "true" ||
        process.env.IGNORE_UNAUTHORIZED_CA === "true"
          ? false
          : true,
    });
  }

  agentCache[cacheKey] = agent;
  return agent;
}

function createAgent(target: URL) {
  if (process.env.PROXY) {
    const proxy = new URL(process.env.PROXY);

    if (process.env.PROXY_USERNAME) {
      proxy.username = process.env.PROXY_USERNAME;
      proxy.password = process.env.PROXY_PASSWORD || "";
    }

    const ProxyAgent = proxy.protocol.includes("http")
      ? HttpsProxyAgent
      : SocksProxyAgent;

    return new ProxyAgent(proxy.toString());
  }

  const allowPrivate = process.env.ALLOW_PRIVATE_NETWORK_ACCESS === "true";
  const lookup = allowPrivate ? undefined : createSafeLookup();

  return getOrCreateAgent(target, lookup);
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
