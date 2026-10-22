const DANGEROUS_SCHEMES = new Set(["javascript", "data", "vbscript"]);

export function isDangerousLinkUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  const stripped = url.replace(/[\u0000- ]+/g, "");
  const colonIndex = stripped.indexOf(":");
  if (colonIndex === -1) return false;

  const scheme = stripped.slice(0, colonIndex).toLowerCase();
  return DANGEROUS_SCHEMES.has(scheme);
}

export default isDangerousLinkUrl;
