import fetch from "node-fetch";
import https from "https";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

export default async function fetchTitleAndHeaders(url: string, content: string | null) {
  if (!url?.startsWith("http://") && !url?.startsWith("https://"))
    return { title: "", headers: null };

  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized:
        process.env.IGNORE_UNAUTHORIZED_CA === "true" ? false : true,
    });

    // fetchOpts allows a proxy to be defined
    let fetchOpts = {
      agent: httpsAgent,
    };

    if (process.env.PROXY) {
      // parse proxy url
      let proxy = new URL(process.env.PROXY);
      // if authentication set, apply to proxy URL
      if (process.env.PROXY_USERNAME) {
        proxy.username = process.env.PROXY_USERNAME;
        proxy.password = process.env.PROXY_PASSWORD || "";
      }

      const proxyAgent = proxy.protocol.includes("http")
        ? HttpsProxyAgent
        : SocksProxyAgent;

      // add socks5/http/https proxy to fetchOpts
      fetchOpts = { agent: new proxyAgent(proxy.toString()) };
    }

    const responsePromise = fetch(url, fetchOpts);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Fetch title timeout"));
      }, 10 * 1000); // Stop after 10 seconds
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);

    if ((response as any)?.status) {
      let text: string;

      if (content) {
        text = content
      } else {
        text = await (response as any).text()
      }

      const headers = (response as Response)?.headers || null;

      return await fetchTitleAndHeadersFromContent(text, headers);
    } else {
      return { title: "", headers: null };
    }
  } catch (err) {
    console.log(err);
    return { title: "", headers: null };
  }
}

export async function fetchTitleAndHeadersFromContent(content: string, headers: Headers) {
  // regular expression to find the <title> tag
  let match = content.match(/<title.*>([^<]*)<\/title>/);

  const title = match?.[1] || "";

  return { title, headers };
}