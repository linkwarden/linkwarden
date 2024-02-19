import fetch from "node-fetch";
import https from "https";
import { SocksProxyAgent } from "socks-proxy-agent";

export default async function getTitle(url: string) {
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

      // add socks5 proxy to fetchOpts
      fetchOpts = { agent: new SocksProxyAgent(proxy.toString()) }; //TODO: add support for http/https proxies
    }

    const response = await fetch(url, fetchOpts);

    const text = await response.text();

    // regular expression to find the <title> tag
    let match = text.match(/<title.*>([^<]*)<\/title>/);
    if (match) return match[1];
    else return "";
  } catch (err) {
    console.log(err);
  }
}
