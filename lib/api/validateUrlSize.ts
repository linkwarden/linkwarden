export default async function validateUrlSize(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD" });

    const totalSizeMB =
      Number(response.headers.get("content-length")) / Math.pow(1024, 2);
    if (totalSizeMB > 50) return null;
    else return response.headers;
  } catch (err) {
    console.log(err);
    return null;
  }
}
