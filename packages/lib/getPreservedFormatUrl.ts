import { ArchivedFormat } from "@linkwarden/types/global";

export default async function getPreservedFormatUrl({
  tokenEndpoint,
  linkId,
  format,
  download = false,
  headers,
  requestInit,
}: {
  tokenEndpoint: string;
  linkId: number;
  format: ArchivedFormat;
  download?: boolean;
  headers?: HeadersInit;
  requestInit?: RequestInit;
}) {
  const response = await fetch(
    `${tokenEndpoint}?linkId=${linkId}&format=${format}`,
    {
      ...requestInit,
      headers,
    }
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.response || "Failed to load archived format.");
  }

  if (typeof data?.response?.url !== "string") {
    throw new Error("Failed to load archived format.");
  }

  if (!download) {
    return data.response.url;
  }

  const url = new URL(data.response.url);
  url.searchParams.set("download", "1");
  return url.toString();
}
