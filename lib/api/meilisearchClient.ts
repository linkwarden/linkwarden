import { MeiliSearch } from "meilisearch";

const host = process.env.MEILISEARCH_HOST;

export const meiliClient = host
  ? new MeiliSearch({
      host,
      apiKey: process.env.MEILISEARCH_KEY,
    })
  : null;
