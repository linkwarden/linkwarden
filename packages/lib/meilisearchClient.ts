import axios from "axios";
import { MeiliSearch } from "meilisearch";

const apiKey = process.env.MEILI_MASTER_KEY;
const timeout = Number(process.env.MEILI_HTTP_TIMEOUT_MS || "") || 60_000;

// Use a dedicated HTTP client for Meilisearch instead of Node's global
// fetch/undici dispatcher. The worker shares that dispatcher with link
// preservation, and while preservation is busy, Meilisearch requests queue
// behind it and hit undici's connect timeout although Meilisearch is healthy.
export const meiliClient = apiKey
  ? new MeiliSearch({
      host: process.env.MEILI_HOST || "http://meilisearch:7700",
      apiKey,
      httpClient: async (url, init) => {
        const response = await axios.request({
          url,
          method: init?.method || "GET",
          headers: init?.headers as Record<string, string> | undefined,
          data: init?.body,
          timeout,
          // Internal traffic to Meilisearch should never go through a proxy.
          proxy: false,
        });

        return response.data;
      },
    })
  : null;
