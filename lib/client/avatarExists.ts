export default async function avatarExists(fileUrl: string): Promise<boolean> {
  const response = await fetch(fileUrl, { method: "HEAD" });
  return !(response.headers.get("content-type") === "text/html");
}
