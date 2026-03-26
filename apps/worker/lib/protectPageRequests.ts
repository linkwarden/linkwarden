import { BrowserContext, Route } from "playwright";
import {
  assertUrlIsSafeForServerSideFetch,
  UnsafeUrlError,
} from "@linkwarden/lib/ssrf";

function isNonNetworkUrl(url: string) {
  return (
    url.startsWith("about:") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  );
}

export default async function protectPageRequests(context: BrowserContext) {
  await context.route("**/*", async (route: Route) => {
    const requestUrl = route.request().url();

    if (isNonNetworkUrl(requestUrl)) {
      await route.continue();
      return;
    }

    try {
      await assertUrlIsSafeForServerSideFetch(requestUrl);
      await route.continue();
    } catch (error) {
      if (error instanceof UnsafeUrlError) {
        await route.abort("blockedbyclient");
        return;
      }

      throw error;
    }
  });
}
