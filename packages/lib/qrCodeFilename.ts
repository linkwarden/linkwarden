export default function qrCodeFilename(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = decodeURIComponent(parsed.pathname)
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean)
      .join("-");
    const slug = path ? `${host}-${path}` : host;
    const sanitized = slug.replace(/[^a-zA-Z0-9.-]/g, "-").slice(0, 80);
    return `qrcode-${sanitized}.png`;
  } catch {
    return "qrcode.png";
  }
}