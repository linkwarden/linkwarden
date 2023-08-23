import fetch from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";

export default async function getTitle(url: string) {
  try {
    // fetchOpts allows a proxy to be defined
    let fetchOpts = {};

    if (process.env.ARCHIVER_PROXY) {
      // parse proxy url
      let proxy = new URL(process.env.ARCHIVER_PROXY)
      // if authentication set, apply to proxy URL
      if (process.env.ARCHIVER_PROXY_USERNAME) {
        proxy.username = process.env.ARCHIVER_PROXY_USERNAME;
        proxy.password = process.env.ARCHIVER_PROXY_PASSWORD || "";
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
