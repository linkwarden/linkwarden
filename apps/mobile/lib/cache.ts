import * as FileSystem from "expo-file-system/legacy";
import NetInfo from "@react-native-community/netinfo";
import { ArchivedFormat, MobileAuth } from "@linkwarden/types/global";
import getPreservedFormatUrl from "@linkwarden/lib/getPreservedFormatUrl";
import { customHeadersFor } from "@/lib/customHeaders";
import { queryPersister } from "@/lib/queryPersister";

type LoadCacheOrFetchOptions<T> = {
  filePath: string;
  setContent: (content: T) => void;
  getCachedContent?: (filePath: string) => Promise<T>;
  fetchContent?: (filePath: string) => Promise<T>;
  shouldFetch?: boolean;
  updatedAt?: string | Date | null;
  onStart?: () => void;
  errorMessage?: string;
};

const staleFileGraceMs = 5000;

export const loadCacheOrFetch = async <T = string>({
  filePath,
  setContent,
  getCachedContent = async (filePath) => filePath as T,
  fetchContent,
  shouldFetch = true,
  updatedAt,
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

  const isStale =
    info.exists &&
    updatedAt != null &&
    ((info as any).modificationTime ?? 0) * 1000 + staleFileGraceMs <
      new Date(updatedAt).getTime();

  const showCached = async () => {
    if (info.exists) setContent(await getCachedContent(filePath));
  };

  if (!isStale) {
    await showCached();

    if (updatedAt != null && info.exists) return;
  }

  if (!shouldFetch || !fetchContent) {
    if (isStale) await showCached();
    return;
  }

  const net = await NetInfo.fetch();

  if (!net.isConnected) {
    if (isStale) await showCached();
    return;
  }

  try {
    const freshContent = await fetchContent(filePath);

    setContent(freshContent);
  } catch (e) {
    if (isStale) await showCached();
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

export const seedFormatCache = async (
  linkId: number,
  format: CacheFormat,
  sourceUri: string
) => {
  const filePath = getCachePathForFormat(linkId, format);

  await FileSystem.makeDirectoryAsync(
    filePath.substring(0, filePath.lastIndexOf("/")),
    { intermediates: true }
  ).catch(() => {});

  await FileSystem.deleteAsync(filePath, { idempotent: true }).catch(() => {});

  await FileSystem.copyAsync({ from: sourceUri, to: filePath });
};

type FetchFormatToCacheOptions = {
  link: { id: number; updatedAt?: string | Date | null };
  format: CacheFormat;
  auth: MobileAuth;
  userContentDomain?: string | null;
  onProgress?: (deltaBytes: number) => void;
};

const connectionErrorFlag = "isConnectionError";

const connectionError = (cause: unknown) =>
  Object.assign(
    new Error(
      `Could not reach the server: ${(cause as any)?.message ?? cause}`
    ),
    { [connectionErrorFlag]: true }
  );

export const isConnectionError = (e: unknown): boolean =>
  Boolean(e && typeof e === "object" && (e as any)[connectionErrorFlag]);

const unavailableStatuses = new Set([502, 503, 504]);

const failedResponse = (status: number) => {
  const error = new Error(`HTTP ${status}`);
  return unavailableStatuses.has(status)
    ? Object.assign(error, { [connectionErrorFlag]: true })
    : error;
};

const cancelledFlag = "isCancelledTransfer";

const cancelledError = () =>
  Object.assign(new Error("Transfer cancelled"), { [cancelledFlag]: true });

export const isCancelledTransfer = (e: unknown): boolean =>
  Boolean(e && typeof e === "object" && (e as any)[cancelledFlag]);

const stallTimeoutMs = 30_000;

const progressStepBytes = Math.round((1024 * 1024) / 10);

const activeTransfers = new Set<{ cancel: () => void }>();

export const cancelActiveTransfers = () => {
  for (const transfer of [...activeTransfers]) transfer.cancel();
};

const downloadWithStallTimeout = async ({
  url,
  toPath,
  headers,
  onBytesWritten,
}: {
  url: string;
  toPath: string;
  headers?: Record<string, string>;
  onBytesWritten?: (totalBytesWritten: number) => void;
}) => {
  let stallTimer: ReturnType<typeof setTimeout> | null = null;
  let interrupt: (e: Error) => void = () => {};
  let settled = false;

  const interrupted = new Promise<never>((_, reject) => {
    interrupt = reject;
  });

  let lastSize = -1;
  const checkStalled = async () => {
    const info = await FileSystem.getInfoAsync(toPath).catch(() => null);
    if (settled) return;

    const size = info?.exists ? (info as any).size ?? 0 : 0;
    if (size > lastSize) {
      lastSize = size;
      armStallTimer();
      return;
    }

    interrupt(new Error("Download stalled"));
  };

  const armStallTimer = () => {
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = setTimeout(checkStalled, stallTimeoutMs);
  };

  const resumable = FileSystem.createDownloadResumable(
    url,
    toPath,
    { headers },
    ({ totalBytesWritten }) => {
      if (settled) return;

      onBytesWritten?.(totalBytesWritten);
      armStallTimer();
    }
  );

  const transfer = { cancel: () => interrupt(cancelledError()) };
  activeTransfers.add(transfer);
  armStallTimer();

  const download = resumable.downloadAsync().catch((e) => {
    throw connectionError(e);
  });
  download.catch(() => {});

  try {
    const result = await Promise.race([download, interrupted]);
    if (!result) throw cancelledError();
    return result;
  } catch (e) {
    resumable.cancelAsync().catch(() => {});
    throw e;
  } finally {
    settled = true;
    activeTransfers.delete(transfer);
    if (stallTimer) clearTimeout(stallTimer);
  }
};

export const fetchFormatToCache = async ({
  link,
  format,
  auth,
  userContentDomain,
  onProgress,
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
    try {
      apiUrl = await getPreservedFormatUrl({
        tokenEndpoint: `${auth.instance}/api/v1/preserved/token`,
        linkId: link.id,
        format: archivedFormat,
        headers,
      });
    } catch (e) {
      throw connectionError(e);
    }
    headers = undefined;
  } else {
    apiUrl = `${auth.instance}/api/v1/archives/${link.id}?format=${archivedFormat}${previewSuffix}`;
  }

  const tmpPath = `${filePath}.part`;
  await FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});

  let reportedBytes = 0;
  const reportBytesWritten = (totalBytesWritten: number) => {
    if (!onProgress) return;

    const target =
      Math.floor(totalBytesWritten / progressStepBytes) * progressStepBytes;
    if (target > reportedBytes) {
      onProgress(target - reportedBytes);
      reportedBytes = target;
    }
  };

  try {
    if (format === "readable") {
      const result = await downloadWithStallTimeout({
        url: apiUrl,
        toPath: tmpPath,
        headers,
        onBytesWritten: reportBytesWritten,
      });
      if (result.status < 200 || result.status >= 300) {
        throw failedResponse(result.status);
      }

      const payload = await FileSystem.readAsStringAsync(tmpPath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const data = JSON.parse(payload).content;

      await FileSystem.writeAsStringAsync(tmpPath, data, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } else {
      const result = await downloadWithStallTimeout({
        url: apiUrl,
        toPath: tmpPath,
        headers: { ...customHeadersFor(apiUrl), ...headers },
        onBytesWritten: reportBytesWritten,
      });
      if (result.status < 200 || result.status >= 300) {
        throw failedResponse(result.status);
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
    queryPersister.removeClient?.(),
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
