export default async function fileExists(fileUrl: string): Promise<boolean> {
  try {
    const response = await fetch(fileUrl, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    console.error("Error checking file existence:", error);
    return false;
  }
}
