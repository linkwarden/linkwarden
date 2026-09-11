import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateText } from "ai";
import { prisma } from "@linkwarden/prisma";
import autoTagLink from "./autoTagLink";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

vi.mock("@linkwarden/prisma", () => ({
  prisma: {
    link: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
    },
  },
}));

const user = {
  id: 1,
  aiTaggingMethod: "GENERATE",
  aiPredefinedTags: [],
} as any;

describe("autoTagLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_MODEL", "test-model");

    vi.mocked(prisma.link.findUnique).mockResolvedValue({
      id: 1,
      url: "https://example.com",
      metaDescription: "A page about Python and machine learning.",
      textContent: null,
    } as any);
    vi.mocked(prisma.link.update).mockResolvedValue({} as any);
  });

  it("tags the link when the AI returns a usable array", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: '["Python", "Machine Learning"]',
    } as any);

    await expect(autoTagLink(user, 1)).resolves.toBe("tagged");

    expect(prisma.link.update).toHaveBeenCalledTimes(1);
    expect(vi.mocked(prisma.link.update).mock.calls[0][0].data.aiTagged).toBe(
      true
    );
  });

  it("throws and leaves the link untagged when the AI yaps instead of answering", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "I'm sorry, I can't help with that request.",
    } as any);

    await expect(autoTagLink(user, 1)).rejects.toThrow();

    expect(prisma.link.update).not.toHaveBeenCalled();
  });

  it("throws and leaves the link untagged when the AI returns broken JSON", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: '```json\n["Python", ',
    } as any);

    await expect(autoTagLink(user, 1)).rejects.toThrow();

    expect(prisma.link.update).not.toHaveBeenCalled();
  });

  it("throws and leaves the link untagged when the provider errors", async () => {
    vi.mocked(generateText).mockRejectedValue(
      new Error("429 Too Many Requests")
    );

    await expect(autoTagLink(user, 1)).rejects.toThrow("429 Too Many Requests");

    expect(prisma.link.update).not.toHaveBeenCalled();
  });

  it("skips the link when there is nothing to describe it", async () => {
    vi.mocked(prisma.link.findUnique).mockResolvedValue({
      id: 1,
      url: "https://example.com",
      metaDescription: null,
      textContent: null,
    } as any);

    await expect(autoTagLink(user, 1)).resolves.toBe("skipped");

    expect(generateText).not.toHaveBeenCalled();
    expect(prisma.link.update).not.toHaveBeenCalled();
  });
});
