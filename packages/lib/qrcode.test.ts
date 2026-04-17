import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import qrCodeFilename from "./qrCodeFilename";

describe("QR Code generation", () => {
  it("generates a PNG buffer from a URL", async () => {
    const buffer = await QRCode.toBuffer("https://example.com", {
      type: "png",
      width: 300,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // PNG magic bytes
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
    expect(buffer[2]).toBe(0x4e); // N
    expect(buffer[3]).toBe(0x47); // G
  });

  it("generates a data URL from a URL", async () => {
    const dataUrl = await QRCode.toDataURL("https://example.com", {
      type: "png",
      width: 300,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("handles long URLs", async () => {
    const longUrl = "https://example.com/" + "a".repeat(500);
    const buffer = await QRCode.toBuffer(longUrl, {
      type: "png",
      width: 300,
      margin: 2,
      errorCorrectionLevel: "L",
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("throws on empty string", async () => {
    await expect(QRCode.toBuffer("", { type: "png" })).rejects.toThrow();
  });
});

describe("qrCodeFilename", () => {
  it("uses hostname from URL", () => {
    expect(qrCodeFilename("https://example.com")).toBe("qrcode-example.com.png");
  });

  it("strips www prefix", () => {
    expect(qrCodeFilename("https://www.example.com")).toBe("qrcode-example.com.png");
  });

  it("includes path segments", () => {
    expect(qrCodeFilename("https://example.com/some/page")).toBe("qrcode-example.com-some-page.png");
  });

  it("sanitizes special characters", () => {
    expect(qrCodeFilename("https://example.com/path%20with%20spaces")).toBe("qrcode-example.com-path-with-spaces.png");
  });

  it("falls back for invalid URLs", () => {
    expect(qrCodeFilename("not-a-url")).toBe("qrcode.png");
  });

  it("truncates long filenames", () => {
    const url = "https://example.com/" + "a".repeat(200);
    const result = qrCodeFilename(url);
    expect(result.length).toBeLessThanOrEqual(80 + "qrcode-".length + ".png".length);
  });
});