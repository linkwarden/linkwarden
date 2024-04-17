import fetch from "node-fetch";
import https from "https";
import { SocksProxyAgent } from "socks-proxy-agent";

export default async function validateUrlSize(url: string) {
  if (process.env.IGNORE_URL_SIZE_LIMIT === "true") return null;

  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized:
        process.env.IGNORE_UNAUTHORIZED_CA === "true" ? false : true,
    });

    let fetchOpts = {
      method: "HEAD",
      agent: httpsAgent,
    };

    if (process.env.PROXY) {
      let proxy = new URL(process.env.PROXY);
      if (process.env.PROXY_USERNAME) {
        proxy.username = process.env.PROXY_USERNAME;
        proxy.password = process.env.PROXY_PASSWORD || "";
      }

      fetchOpts = {
        method: "HEAD",
        agent: new SocksProxyAgent(proxy.toString()),
      };
    }

    const response = await fetch(url, fetchOpts);

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
