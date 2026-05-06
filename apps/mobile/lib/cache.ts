import * as FileSystem from "expo-file-system/legacy";
import NetInfo from "@react-native-community/netinfo";
import { ArchivedFormat, MobileAuth } from "@linkwarden/types/global";
import getPreservedFormatUrl from "@linkwarden/lib/getPreservedFormatUrl";

type LoadCacheOrFetchOptions<T> = {
  filePath: string;
  setContent: (content: T) => void;
  getCachedContent?: (filePath: string) => Promise<T>;
  fetchContent?: (filePath: string) => Promise<T>;
  shouldFetch?: boolean;
  onStart?: () => void;
  errorMessage?: string;
};

export const loadCacheOrFetch = async <T = string>({
  filePath,
  setContent,
  getCachedContent = async (filePath) => filePath as T,
  fetchContent,
  shouldFetch = true,
  onStart,
  errorMessage = "Failed to fetch content",
}: LoadCacheOrFetchOptions<T>) => {
  onStart?.();

  await FileSystem.makeDirectoryAsync(
    filePath.substring(0, filePath.lastIndexOf("/")),
    {
      intermediates: true,
    }
  ).catch(() => {});

  const [info] = await Promise.all([FileSystem.getInfoAsync(filePath)]);

  if (info.exists) {
    const cachedContent = await getCachedContent(filePath);
    setContent(cachedContent);
  }

  if (!shouldFetch || !fetchContent) {
    return;
  }

  const net = await NetInfo.fetch();

  if (!net.isConnected) {
    return;
  }

  try {
    const freshContent = await fetchContent(filePath);

    setContent(freshContent);
  } catch (e) {
    console.error(errorMessage, e);
  }
};

export type CacheFormat =
  | "readable"
  | "webpage"
  | "jpeg"
  | "png"
  | "pdf"
  | "preview";

export const getCachePathForFormat = (
  linkId: number,
  format: CacheFormat
): string => {
  switch (format) {
    case "readable":
      return (
        FileSystem.documentDirectory +
        `archivedData/readable/link_${linkId}.html`
      );
    case "webpage":
      return (
        FileSystem.documentDirectory +
        `archivedData/webpage/link_${linkId}.html`
      );
    case "jpeg":
      return (
        FileSystem.documentDirectory + `archivedData/jpeg/link_${linkId}.jpeg`
      );
    case "png":
      return (
        FileSystem.documentDirectory + `archivedData/png/link_${linkId}.png`
      );
    case "pdf":
      return (
        FileSystem.documentDirectory + `archivedData/pdf/link_${linkId}.pdf`
      );
    case "preview":
      return (
        FileSystem.documentDirectory +
        `archivedData/previews/link_${linkId}.jpg`
      );
  }
};

type FetchFormatToCacheOptions = {
  link: { id: number; updatedAt?: string | Date | null };
  format: CacheFormat;
  auth: MobileAuth;
  userContentDomain?: string | null;
};

export const fetchFormatToCache = async ({
  link,
  format,
  auth,
  userContentDomain,
}: FetchFormatToCacheOptions): Promise<{
  uri: string;
  size: number;
  delta: number;
}> => {
  const filePath = getCachePathForFormat(link.id, format);

  await FileSystem.makeDirectoryAsync(
    filePath.substring(0, filePath.lastIndexOf("/")),
    { intermediates: true }
  ).catch(() => {});

  const prev = await FileSystem.getInfoAsync(filePath);
  const prevSize = prev.exists ? (prev as any).size ?? 0 : 0;

  const archivedFormat =
    format === "readable"
      ? ArchivedFormat.readability
      : format === "webpage"
        ? ArchivedFormat.monolith
        : format === "jpeg"
          ? ArchivedFormat.jpeg
          : format === "png"
            ? ArchivedFormat.png
            : format === "pdf"
              ? ArchivedFormat.pdf
              : ArchivedFormat.jpeg;

  const previewSuffix =
    format === "preview" ? `&preview=true&updatedAt=${link.updatedAt}` : "";

  let apiUrl: string;
  let headers: Record<string, string> | undefined = {
    Authorization: `Bearer ${auth.session}`,
  };

  if (format === "webpage" && userContentDomain) {
    apiUrl = await getPreservedFormatUrl({
      tokenEndpoint: `${auth.instance}/api/v1/preserved/token`,
      linkId: link.id,
      format: archivedFormat,
      headers,
    });
    headers = undefined;
  } else {
    apiUrl = `${auth.instance}/api/v1/archives/${link.id}?format=${archivedFormat}${previewSuffix}`;
  }

  const tmpPath = `${filePath}.part`;
  await FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});

  try {
    if (format === "readable") {
      const response = await fetch(apiUrl, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()).content;

      await FileSystem.writeAsStringAsync(tmpPath, data, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } else {
      const result = await FileSystem.downloadAsync(apiUrl, tmpPath, {
        headers,
      });
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`HTTP ${result.status}`);
      }
    }

    await FileSystem.deleteAsync(filePath, { idempotent: true }).catch(
      () => {}
    );
    await FileSystem.moveAsync({ from: tmpPath, to: filePath });

    const info = await FileSystem.getInfoAsync(filePath);
    const size = (info as any).size ?? 0;
    return { uri: filePath, size, delta: size - prevSize };
  } catch (e) {
    await FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});
    throw e;
  }
};

export const getCacheSize = async (): Promise<number> => {
  const root = FileSystem.documentDirectory + "archivedData";

  const rootInfo = await FileSystem.getInfoAsync(root);
  if (!rootInfo.exists) return 0;

  return rootInfo.size ?? 0;
};

export const clearCache = async () => {
  await Promise.all([
    FileSystem.deleteAsync(FileSystem.documentDirectory + "archivedData", {
      idempotent: true,
    }),
    FileSystem.deleteAsync(FileSystem.documentDirectory + "mmkv", {
      idempotent: true,
    }),
  ]);
};

export const deleteLinkCache = async (linkId: number) => {
  await Promise.all(
    (
      ["readable", "webpage", "jpeg", "png", "pdf", "preview"] as CacheFormat[]
    ).map((format) =>
      FileSystem.deleteAsync(getCachePathForFormat(linkId, format), {
        idempotent: true,
      })
    )
  );
};
