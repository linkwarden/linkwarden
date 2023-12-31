import fetch from "node-fetch";
import https from "https";
export default async function getTitle(url: string) {
  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized:
        process.env.IGNORE_UNAUTHORIZED_CA === "true" ? false : true,
    });

    const response = await fetch(url, {
      agent: httpsAgent,
    });
    const text = await response.text();

    // regular expression to find the <title> tag
    let match = text.match(/<title.*>([^<]*)<\/title>/);
    if (match) return match[1];
    else return "";
  } catch (err) {
    console.log(err);
  }
}
