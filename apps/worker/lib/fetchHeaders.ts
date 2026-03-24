import { safeFetch } from "@linkwarden/lib/safeFetch";

export default async function fetchHeaders(url: string) {
  if (process.env.IGNORE_URL_SIZE_LIMIT === "true") return null;

  try {
    const responsePromise = safeFetch(url, { method: "HEAD" });

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
