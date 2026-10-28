import { describe, expect, it } from "vitest";
import { buildManifest, resolveTarget } from "./manifest.config";

// Firefox's own list (CommonDataCollectionPermission in its manifest schema).
const dataCollectionTypes = [
  "authenticationInfo",
  "bookmarksInfo",
  "browsingActivity",
  "financialAndPaymentInfo",
  "healthInfo",
  "locationInfo",
  "personalCommunications",
  "personallyIdentifyingInfo",
  "searchTerms",
  "websiteActivity",
  "websiteContent",
];

type Gecko = {
  id?: string;
  strict_min_version?: string;
  data_collection_permissions?: { required?: string[]; optional?: string[] };
};

function gecko(manifest: ReturnType<typeof buildManifest>) {
  return (manifest.browser_specific_settings as { gecko?: Gecko }).gecko;
}

function major(version: string | undefined) {
  return Number(version?.split(".")[0]);
}

describe("buildManifest", () => {
  it("keeps the Firefox add-on id and the Chrome minimum on the default build", () => {
    const manifest = buildManifest("default");

    expect(gecko(manifest)?.id).toBe("jordanlinkwarden@gmail.com");
    expect(manifest.minimum_chrome_version).toBe("121");
    expect(manifest.background).toEqual({
      service_worker: "background.js",
      scripts: ["background.js"],
      type: "module",
    });
    expect(manifest.permissions).toContain("bookmarks");
    expect(manifest.omnibox).toEqual({ keyword: "lk" });
  });

  it("gives Safari only its own settings", () => {
    const manifest = buildManifest("safari");

    expect(manifest.browser_specific_settings).toEqual({
      safari: { strict_min_version: "15.4" },
    });
    expect(manifest).not.toHaveProperty("minimum_chrome_version");
    expect(manifest).not.toHaveProperty("omnibox");
    expect(manifest.permissions).not.toContain("bookmarks");
    expect(manifest.background).not.toHaveProperty("service_worker");
  });

  it("declares what the default build sends, using Firefox's categories", () => {
    const permissions = gecko(buildManifest("default"))
      ?.data_collection_permissions;

    expect(permissions).toEqual({
      required: ["authenticationInfo", "browsingActivity", "websiteContent"],
    });
    for (const type of permissions?.required ?? []) {
      expect(dataCollectionTypes).toContain(type);
    }
  });

  it("requires a Firefox that understands data_collection_permissions", () => {
    // Firefox 140 added the key; 127 and older reject the manifest outright.
    expect(
      major(gecko(buildManifest("default"))?.strict_min_version)
    ).toBeGreaterThanOrEqual(140);
  });
});

describe("resolveTarget", () => {
  it("defaults to the Chrome and Firefox build", () => {
    expect(resolveTarget(undefined)).toBe("default");
    expect(resolveTarget("default")).toBe("default");
    expect(resolveTarget("safari")).toBe("safari");
  });

  it("rejects unknown targets", () => {
    expect(() => resolveTarget("firefox")).toThrow(/Unknown EXT_TARGET/);
    expect(() => resolveTarget("")).toThrow(/Unknown EXT_TARGET/);
  });
});
