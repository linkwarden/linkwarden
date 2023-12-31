import fetch from "node-fetch";
import https from "https";

export default async function validateUrlSize(url: string) {
  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized:
        process.env.IGNORE_UNAUTHORIZED_CA === "true" ? false : true,
    });

    const response = await fetch(url, {
      method: "HEAD",
      agent: httpsAgent,
    });

    const totalSizeMB =
      Number(response.headers.get("content-length")) / Math.pow(1024, 2);
    if (totalSizeMB > (Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 30))
      return null;
    else return response.headers;
  } catch (err) {
    console.log(err);
    return null;
  }
}
