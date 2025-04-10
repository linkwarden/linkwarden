import { MeiliSearch } from "meilisearch";

const apiKey = process.env.MEILI_MASTER_KEY;

export const meiliClient = apiKey
  ? new MeiliSearch({
      host: process.env.MEILI_HOST || "http://meilisearch:7700",
      apiKey,
    })
  : null;
