import { safeFetch } from "@linkwarden/lib/safeFetch";

export default async function fetchTitleAndHeaders(
  url: string,
  content?: string
) {
  if (!content && !url?.startsWith("http://") && !url?.startsWith("https://"))
    return { title: "", headers: null };

  try {
    const responsePromise = content ? Promise.resolve(null) : safeFetch(url);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Fetch title timeout"));
      }, 10 * 1000); // Stop after 10 seconds
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);

    if ((response as any)?.status || content) {
      let text: string;

      if (content) {
        text = content;
      } else {
        text = await (response as any).text();
      }

      const headers = (response as Response | null)?.headers || null;

      // regular expression to find the <title> tag
      let match = text.match(/<title.*>([^<]*)<\/title>/);

      const title = match?.[1] || "";

      return { title, headers };
    } else {
      return { title: "", headers: null };
    }
  } catch (err) {
    console.log(err);
    return { title: "", headers: null };
  }
}
