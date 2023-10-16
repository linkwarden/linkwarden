const avatarCache = new Map();

export default async function avatarExists(fileUrl: string): Promise<boolean> {
  if (avatarCache.has(fileUrl)) {
    return avatarCache.get(fileUrl);
  }

  const response = await fetch(fileUrl, { method: "HEAD" });
  const exists = !(response.headers.get("content-type") === "text/html");

  avatarCache.set(fileUrl, exists);
  return exists;
}
