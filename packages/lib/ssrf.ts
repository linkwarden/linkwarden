import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

export class UnsafeUrlError extends Error {
  code = "ERR_UNSAFE_URL";

  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export type ResolvedAddress = {
  address: string;
  family: 4 | 6;
};

export type HostnameLookup = (
  hostname: string
) => Promise<ReadonlyArray<ResolvedAddress>>;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "broadcasthost",
]);

const BLOCKED_HOSTNAME_SUFFIXES = [
  ".localhost",
  ".local",
  ".localdomain",
  ".internal",
];

const IPV4_BLOCKED_CIDRS = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const;

const IPV6_BLOCKED_CIDRS = [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
] as const;

const IPV4_BLOCKED_RANGES = IPV4_BLOCKED_CIDRS.map(([address, prefix]) => {
  const parsed = parseIPv4(address);

  if (parsed === null) {
    throw new Error(`Invalid blocked IPv4 CIDR base: ${address}/${prefix}`);
  }

  return {
    network: parsed,
    mask: ipv4Mask(prefix),
  };
});

const IPV6_BLOCKED_RANGES = IPV6_BLOCKED_CIDRS.map(([address, prefix]) => {
  const parsed = parseIPv6(address);

  if (parsed === null) {
    throw new Error(`Invalid blocked IPv6 CIDR base: ${address}/${prefix}`);
  }

  return {
    network: parsed,
    prefix,
  };
});

function ipv4Mask(prefixLength: number) {
  if (prefixLength === 0) return 0;
  return Math.floor(2 ** 32 - 2 ** (32 - prefixLength));
}

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/\.+$/, "");
}

function parseIPv4(address: string) {
  const octets = address.split(".");

  if (octets.length !== 4) return null;

  let value = 0;

  for (const octet of octets) {
    if (!/^\d{1,3}$/.test(octet)) return null;

    const parsed = Number(octet);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) return null;

    value = value * 256 + parsed;
  }

  return value;
}

function ipv4TailToHexSegments(address: string) {
  const parsed = parseIPv4(address);
  if (parsed === null) return null;

  const high = Math.floor(parsed / 65536)
    .toString(16)
    .padStart(4, "0");
  const low = (parsed % 65536).toString(16).padStart(4, "0");

  return [high, low];
}

function parseIPv6(address: string) {
  const normalized = address.toLowerCase().split("%")[0];

  if (!normalized) return null;

  const hasDoubleColon = normalized.includes("::");

  if (hasDoubleColon && normalized.indexOf("::") !== normalized.lastIndexOf("::"))
    return null;

  const [leftRaw, rightRaw = ""] = hasDoubleColon
    ? normalized.split("::")
    : [normalized, ""];

  const expandSide = (side: string) => {
    if (!side) return [] as string[];

    return side.split(":").flatMap((segment) => {
      if (!segment) return [segment];
      if (segment.includes(".")) {
        const converted = ipv4TailToHexSegments(segment);
        return converted ?? [segment];
      }
      return [segment];
    });
  };

  const left = expandSide(leftRaw);
  const right = expandSide(rightRaw);

  const segments = hasDoubleColon
    ? (() => {
        const zeroCount = 8 - (left.length + right.length);
        if (zeroCount < 1) return null;

        return [
          ...left,
          ...Array.from({ length: zeroCount }, () => "0"),
          ...right,
        ];
      })()
    : left;

  if (!segments || segments.length !== 8) return null;

  const parsedSegments: number[] = [];

  for (const segment of segments) {
    if (!/^[0-9a-f]{1,4}$/i.test(segment)) return null;
    parsedSegments.push(parseInt(segment, 16));
  }

  return parsedSegments;
}

function extractIPv4FromMappedIPv6(address: string) {
  const normalized = address.toLowerCase();

  if (!normalized.includes(".")) return null;

  const ipv4Candidate = normalized.slice(normalized.lastIndexOf(":") + 1);
  return parseIPv4(ipv4Candidate) === null ? null : ipv4Candidate;
}

export function isHostnameBlockedForServerSideFetch(hostname: string) {
  const normalized = normalizeHostname(hostname);

  if (!normalized) return true;
  if (BLOCKED_HOSTNAMES.has(normalized)) return true;
  if (BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => normalized.endsWith(suffix)))
    return true;

  return !normalized.includes(".") && isIP(normalized) === 0;
}

export function isIpAddressBlockedForServerSideFetch(address: string) {
  const ipv4 =
    parseIPv4(address) ?? (() => {
      const mapped = extractIPv4FromMappedIPv6(address);
      return mapped ? parseIPv4(mapped) : null;
    })();

  if (ipv4 !== null) {
    return IPV4_BLOCKED_RANGES.some(
      ({ network, mask }) => (ipv4 & mask) === (network & mask)
    );
  }

  const ipv6 = parseIPv6(address);
  if (ipv6 === null) return true;

  return IPV6_BLOCKED_RANGES.some(({ network, prefix }) =>
    ipv6MatchesPrefix(ipv6, network, prefix)
  );
}

function ipv6MatchesPrefix(
  address: number[],
  network: number[],
  prefixLength: number
) {
  const fullSegments = Math.floor(prefixLength / 16);
  const remainingBits = prefixLength % 16;

  for (let index = 0; index < fullSegments; index++) {
    if (address[index] !== network[index]) return false;
  }

  if (remainingBits === 0) return true;

  const mask = (0xffff << (16 - remainingBits)) & 0xffff;
  return (
    (address[fullSegments] & mask) === (network[fullSegments] & mask)
  );
}

export const defaultHostnameLookup: HostnameLookup = async (hostname) => {
  const resolved = await dnsLookup(hostname, { all: true, verbatim: true });

  return resolved
    .filter(
      (entry): entry is { address: string; family: 4 | 6 } =>
        entry.family === 4 || entry.family === 6
    )
    .map((entry) => ({
      address: entry.address,
      family: entry.family,
    }));
};

export async function resolveHostnameForServerSideFetch(
  hostname: string,
  lookup: HostnameLookup = defaultHostnameLookup
) {
  const normalized = normalizeHostname(hostname);

  if (isHostnameBlockedForServerSideFetch(normalized)) {
    throw new UnsafeUrlError("URL resolves to a blocked internal hostname.");
  }

  const ipFamily = isIP(normalized);

  if (ipFamily === 4 || ipFamily === 6) {
    if (isIpAddressBlockedForServerSideFetch(normalized)) {
      throw new UnsafeUrlError("URL resolves to a blocked internal IP address.");
    }

    return [{ address: normalized, family: ipFamily }] as const;
  }

  let addresses: ReadonlyArray<ResolvedAddress>;

  try {
    addresses = await lookup(normalized);
  } catch (error: any) {
    throw new UnsafeUrlError(
      error?.code === "ENOTFOUND" || error?.code === "EAI_AGAIN"
        ? "URL hostname could not be resolved."
        : "URL hostname lookup failed."
    );
  }

  if (!addresses.length) {
    throw new UnsafeUrlError("URL hostname did not resolve to a public IP.");
  }

  const blockedAddress = addresses.find((entry) =>
    isIpAddressBlockedForServerSideFetch(entry.address)
  );

  if (blockedAddress) {
    throw new UnsafeUrlError("URL resolves to a blocked internal IP address.");
  }

  return addresses;
}

export async function assertUrlIsSafeForServerSideFetch(
  value: string,
  options?: {
    lookup?: HostnameLookup;
    allowPrivateNetworkAccess?: boolean;
  }
) {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http:// and https:// URLs can be archived.");
  }

  if (
    options?.allowPrivateNetworkAccess ||
    process.env.ALLOW_PRIVATE_NETWORK_ACCESS === "true"
  ) {
    return url;
  }

  await resolveHostnameForServerSideFetch(url.hostname, options?.lookup);

  return url;
}

export async function isUrlSafeForServerSideFetch(
  value: string,
  options?: {
    lookup?: HostnameLookup;
    allowPrivateNetworkAccess?: boolean;
  }
) {
  try {
    await assertUrlIsSafeForServerSideFetch(value, options);
    return true;
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return false;
    }

    throw error;
  }
}
