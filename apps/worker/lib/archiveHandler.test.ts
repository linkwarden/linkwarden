import { beforeEach, describe, expect, it, vi } from "vitest";
import { determineLinkType } from "./archiveHandler";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  fetchHeaders: vi.fn(),
}));

vi.mock("@linkwarden/prisma", () => ({
  prisma: { link: { update: mocks.update } },
}));
vi.mock("./fetchHeaders", () => ({ default: mocks.fetchHeaders }));

describe("determineLinkType", () => {
  beforeEach(() => {
    mocks.update.mockReset();
    mocks.fetchHeaders.mockReset();
  });

  it("detects the type from the content-type header", async () => {
    mocks.fetchHeaders.mockResolvedValue(
      new Headers({ "content-type": "application/pdf" })
    );

    await expect(
      determineLinkType(1, "https://example.com/doc.pdf", "url")
    ).resolves.toMatchObject({ linkType: "pdf" });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { type: "pdf" },
    });
  });

  it("keeps the stored type when no headers are available", async () => {
    mocks.fetchHeaders.mockResolvedValue(null);

    await expect(
      determineLinkType(1, "https://example.com/doc.pdf", "pdf")
    ).resolves.toMatchObject({ linkType: "pdf" });

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("still reports a url when that is the stored type", async () => {
    mocks.fetchHeaders.mockResolvedValue(null);

    await expect(
      determineLinkType(1, "https://example.com/page", "url")
    ).resolves.toMatchObject({ linkType: "url" });
  });

  it("lets the header override a stale stored type", async () => {
    mocks.fetchHeaders.mockResolvedValue(
      new Headers({ "content-type": "text/html" })
    );

    await expect(
      determineLinkType(1, "https://example.com/page", "pdf")
    ).resolves.toMatchObject({ linkType: "url" });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { type: "url" },
    });
  });
});
