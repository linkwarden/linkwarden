import fetch from "node-fetch";
import https from "https";
import { SocksProxyAgent } from "socks-proxy-agent";

export default async function fetchHeaders(url: string) {
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

    const responsePromise = fetch(url, fetchOpts);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Fetch header timeout"));
      }, 10 * 1000); // Stop after 10 seconds
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);

    return (response as Response)?.headers || null;
  } catch (err) {
    console.log(err);
    return null;
  }
}
