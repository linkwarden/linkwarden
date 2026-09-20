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

  it("keeps the stored type when no headers are available", async () => {
    mocks.fetchHeaders.mockResolvedValue(null);

    await expect(
      determineLinkType(1, "https://example.com/doc.pdf", "pdf")
    ).resolves.toMatchObject({ linkType: "pdf" });

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("does not assume an image extension when no headers are available", async () => {
    mocks.fetchHeaders.mockResolvedValue(null);

    await expect(
      determineLinkType(1, "https://example.com/photo.jpg", "image")
    ).resolves.toMatchObject({ linkType: "url" });

    expect(mocks.update).not.toHaveBeenCalled();
  });

});
