import { describe, expect, it } from "vitest";
import {
  assertUrlIsSafeForServerSideFetch,
  isHostnameBlockedForServerSideFetch,
  isIpAddressBlockedForServerSideFetch,
  resolveHostnameForServerSideFetch,
  UnsafeUrlError,
} from "./ssrf";

describe("ssrf guard", () => {
  it("blocks localhost hostnames", () => {
    expect(isHostnameBlockedForServerSideFetch("localhost")).toBe(true);
    expect(isHostnameBlockedForServerSideFetch("subdomain.localhost")).toBe(
      true
    );
  });

  it("blocks single-label internal hostnames", () => {
    expect(isHostnameBlockedForServerSideFetch("meilisearch")).toBe(true);
    expect(isHostnameBlockedForServerSideFetch("postgres")).toBe(true);
  });

  it("blocks private and loopback IP literals", () => {
    expect(isIpAddressBlockedForServerSideFetch("127.0.0.1")).toBe(true);
    expect(isIpAddressBlockedForServerSideFetch("169.254.169.254")).toBe(true);
    expect(isIpAddressBlockedForServerSideFetch("::1")).toBe(true);
    expect(isIpAddressBlockedForServerSideFetch("fc00::1")).toBe(true);
  });

  it("allows public hostnames that resolve to public IPs", async () => {
    await expect(
      assertUrlIsSafeForServerSideFetch("https://example.com", {
        lookup: async () => [{ address: "93.184.216.34", family: 4 }],
      })
    ).resolves.toBeInstanceOf(URL);
  });

  it("blocks hostnames that resolve to private IPs", async () => {
    await expect(
      assertUrlIsSafeForServerSideFetch("https://example.com", {
        lookup: async () => [{ address: "10.0.0.8", family: 4 }],
      })
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("blocks IPv6 loopback literals", async () => {
    await expect(
      assertUrlIsSafeForServerSideFetch("http://[::1]/")
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("blocks private IPv4 addresses embedded in IPv6", () => {
    expect(isIpAddressBlockedForServerSideFetch("::ffff:7f00:1")).toBe(true); // IPv4-mapped 127.0.0.1
    expect(isIpAddressBlockedForServerSideFetch("::ffff:a9fe:a9fe")).toBe(true); // IPv4-mapped 169.254.169.254
    expect(isIpAddressBlockedForServerSideFetch("::ffff:a00:1")).toBe(true); // IPv4-mapped 10.0.0.1
    expect(isIpAddressBlockedForServerSideFetch("64:ff9b::7f00:1")).toBe(true); // NAT64 127.0.0.1
    expect(isIpAddressBlockedForServerSideFetch("2002:a9fe:a9fe::")).toBe(true); // 6to4 169.254.169.254
    expect(
      isIpAddressBlockedForServerSideFetch(
        "2001:0:4136:e378:8000:63bf:80ff:fffe"
      )
    ).toBe(true); // Teredo, client 127.0.0.1
  });

  it("allows public IPv4 addresses embedded in IPv6", () => {
    expect(isIpAddressBlockedForServerSideFetch("::ffff:808:808")).toBe(false);
    expect(isIpAddressBlockedForServerSideFetch("64:ff9b::808:808")).toBe(
      false
    );
    expect(isIpAddressBlockedForServerSideFetch("2002:808:808::1")).toBe(false);
  });

  it("blocks IPv4-mapped literals passed without brackets (archive proxy)", async () => {
    await expect(
      resolveHostnameForServerSideFetch("::ffff:7f00:1")
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("blocks hostnames that resolve to IPv4-mapped private IPs", async () => {
    await expect(
      assertUrlIsSafeForServerSideFetch("https://example.com", {
        lookup: async () => [{ address: "::ffff:a9fe:a9fe", family: 6 }],
      })
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });
});
