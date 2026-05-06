import { create } from "zustand";
import NetInfo from "@react-native-community/netinfo";
import {
  LinkIncludingShortenedCollectionAndTags,
  MobileAuth,
} from "@linkwarden/types/global";
import { formatAvailable } from "@linkwarden/lib/formatStats";
import * as FileSystem from "expo-file-system/legacy";
import { CacheFormat, fetchFormatToCache, getCacheSize } from "@/lib/cache";
import { queryClient } from "@/lib/queryClient";

type SyncStatus = "idle" | "syncing" | "paused";

type OfflineSyncState = {
  status: SyncStatus;
  processed: number;
  total: number;
  failed: number;
  currentLinkId: number | null;
  bytesUsed: number;
  setStatus: (status: SyncStatus) => void;
  setProgress: (processed: number, total: number) => void;
  incrementProcessed: () => void;
  incrementFailed: () => void;
  setCurrentLinkId: (id: number | null) => void;
  setBytesUsed: (bytes: number) => void;
  addBytes: (delta: number) => void;
  reset: () => void;
};

export const useOfflineSyncStore = create<OfflineSyncState>((set) => ({
  status: "idle",
  processed: 0,
  total: 0,
  failed: 0,
  currentLinkId: null,
  bytesUsed: 0,
  setStatus: (status) => set({ status }),
  setProgress: (processed, total) =>
    set((s) => ({ processed, total, failed: processed === 0 ? 0 : s.failed })),
  incrementProcessed: () => set((s) => ({ processed: s.processed + 1 })),
  incrementFailed: () => set((s) => ({ failed: s.failed + 1 })),
  setCurrentLinkId: (id) => set({ currentLinkId: id }),
  setBytesUsed: (bytes) => set({ bytesUsed: bytes }),
  addBytes: (delta) =>
    set((s) => ({ bytesUsed: Math.max(0, s.bytesUsed + delta) })),
  reset: () =>
    set({
      status: "idle",
      processed: 0,
      total: 0,
      failed: 0,
      currentLinkId: null,
    }),
}));

let cancelled = false;
let runPromise: Promise<void> | null = null;
let syncGeneration = 0;
let netUnsubscribe: (() => void) | null = null;
let cacheUnsubscribe: (() => void) | null = null;
let cacheSyncTimeout: ReturnType<typeof setTimeout> | null = null;
let activeAuth: MobileAuth | null = null;
let activeUserContentDomain: string | null | undefined = undefined;
let syncQueryWriteDepth = 0;
let ignoredQueryKeyClearTimeout: ReturnType<typeof setTimeout> | null = null;

const archiveRoot = FileSystem.documentDirectory + "archivedData";
const staleFileGraceMs = 5000;

const formatDirectories: Record<
  CacheFormat,
  { dirName: string; extension: string }
> = {
  readable: { dirName: "readable", extension: "html" },
  webpage: { dirName: "webpage", extension: "html" },
  jpeg: { dirName: "jpeg", extension: "jpeg" },
  png: { dirName: "png", extension: "png" },
  pdf: { dirName: "pdf", extension: "pdf" },
  preview: { dirName: "previews", extension: "jpg" },
};

type CachedFile = {
  path: string;
  size: number;
  linkId?: number;
  format?: CacheFormat;
  modifiedAt?: number;
  partial: boolean;
};

type CacheSnapshot = {
  bytesUsed: number;
  filesByLinkId: Map<number, CachedFile[]>;
  formatsByLinkId: Map<number, Map<CacheFormat, CachedFile>>;
  partialFiles: CachedFile[];
};

type LinksCacheSnapshot = {
  links: LinkIncludingShortenedCollectionAndTags[];
  hasLinkSource: boolean;
};

const getLinkFreshnessTime = (link: LinkIncludingShortenedCollectionAndTags) =>
  new Date((link as any)?.updatedAt).getTime();

const getFileModifiedAt = (info: any): number | undefined => {
  if (
    typeof info.modificationTime !== "number" ||
    !Number.isFinite(info.modificationTime)
  ) {
    return undefined;
  }

  return info.modificationTime > 10_000_000_000
    ? info.modificationTime
    : info.modificationTime * 1000;
};

const isOnline = (state: {
  isConnected: boolean | null;
  isInternetReachable?: boolean | null;
}) => state.isConnected === true && state.isInternetReachable !== false;

const ignoredQueryKeySignatures = new Set<string>();

const getQueryKeySignature = (queryKey: unknown) => {
  try {
    return JSON.stringify(queryKey);
  } catch {
    return undefined;
  }
};

const ignoreQueryKeyTemporarily = (queryKey: unknown) => {
  const signature = getQueryKeySignature(queryKey);
  if (!signature) return;

  ignoredQueryKeySignatures.add(signature);
  if (ignoredQueryKeyClearTimeout) clearTimeout(ignoredQueryKeyClearTimeout);
  ignoredQueryKeyClearTimeout = setTimeout(() => {
    ignoredQueryKeySignatures.clear();
    ignoredQueryKeyClearTimeout = null;
  }, 500);
};

const sameArchiveState = (a: any, b: LinkIncludingShortenedCollectionAndTags) =>
  a?.id === b.id &&
  a?.updatedAt === b.updatedAt &&
  a?.preview === b.preview &&
  a?.readable === (b as any).readable &&
  a?.monolith === (b as any).monolith &&
  a?.pdf === (b as any).pdf &&
  a?.image === (b as any).image;

const setCachedLinkQueryData = (
  link: LinkIncludingShortenedCollectionAndTags & { id: number }
) => {
  const queryKey = ["link", link.id, false] as const;
  const existing = queryClient.getQueryData(queryKey);
  if (sameArchiveState(existing, link)) return;

  ignoreQueryKeyTemporarily(queryKey);
  syncQueryWriteDepth += 1;
  try {
    queryClient.setQueryData(queryKey, link);
  } finally {
    syncQueryWriteDepth -= 1;
  }
};

const getLinksFromCache = (): LinksCacheSnapshot => {
  const linksById = new Map<number, LinkIncludingShortenedCollectionAndTags>();
  const add = (link: any) => {
    const id = Number(link?.id);
    if (!Number.isFinite(id)) return;

    const existing = linksById.get(id);
    if (
      !existing ||
      getLinkFreshnessTime(link) >= getLinkFreshnessTime(existing)
    ) {
      linksById.set(id, link);
    }
  };
  let hasLinkSource = false;

  for (const query of queryClient.getQueryCache().getAll()) {
    const key = query.queryKey;
    const data = query.state.data as any;
    if (!data) continue;
    if (!Array.isArray(key)) continue;

    if (key[0] === "links") {
      if (Array.isArray(data.pages)) hasLinkSource = true;
      for (const page of data.pages ?? []) {
        for (const link of page?.links ?? []) add(link);
      }
    } else if (key[0] === "dashboardData") {
      if (Array.isArray(data.links)) hasLinkSource = true;
      for (const link of data.links ?? []) add(link);
    } else if (key[0] === "link") {
      if (Number.isFinite(Number(data?.id))) hasLinkSource = true;
      add(data);
    }
  }

  return {
    links: Array.from(linksById.values()),
    hasLinkSource,
  };
};

const getFormatForCacheFile = (
  dirName: string,
  extension: string
): CacheFormat | undefined => {
  const entry = Object.entries(formatDirectories).find(
    ([, value]) => value.dirName === dirName && value.extension === extension
  );
  return entry?.[0] as CacheFormat | undefined;
};

const parseCacheFile = (
  dirName: string,
  fileName: string
): Pick<CachedFile, "linkId" | "format" | "partial"> => {
  const match = fileName.match(/^link_(\d+)\.([a-z0-9]+)(\.part)?$/i);
  if (!match) return { partial: false };

  const linkId = Number(match[1]);
  if (!Number.isFinite(linkId)) return { partial: false };

  return {
    linkId,
    format: getFormatForCacheFile(dirName, match[2].toLowerCase()),
    partial: Boolean(match[3]),
  };
};

const createEmptyCacheSnapshot = (): CacheSnapshot => ({
  bytesUsed: 0,
  filesByLinkId: new Map(),
  formatsByLinkId: new Map(),
  partialFiles: [],
});

const addFileToSnapshot = (snapshot: CacheSnapshot, file: CachedFile) => {
  snapshot.bytesUsed += file.size;

  if (file.partial) {
    snapshot.partialFiles.push(file);
  }

  if (file.linkId === undefined) return;

  const files = snapshot.filesByLinkId.get(file.linkId) ?? [];
  files.push(file);
  snapshot.filesByLinkId.set(file.linkId, files);

  if (!file.format || file.partial) return;

  const formats = snapshot.formatsByLinkId.get(file.linkId) ?? new Map();
  formats.set(file.format, file);
  snapshot.formatsByLinkId.set(file.linkId, formats);
};

const scanCacheSnapshot = async (): Promise<CacheSnapshot> => {
  const snapshot = createEmptyCacheSnapshot();
  const rootInfo = await FileSystem.getInfoAsync(archiveRoot).catch(() => null);
  if (!rootInfo?.exists) return snapshot;

  const subdirs = await FileSystem.readDirectoryAsync(archiveRoot).catch(
    () => []
  );

  await Promise.all(
    subdirs.map(async (dirName) => {
      const dirPath = `${archiveRoot}/${dirName}`;
      const files = await FileSystem.readDirectoryAsync(dirPath).catch(
        () => []
      );

      await Promise.all(
        files.map(async (fileName) => {
          const path = `${dirPath}/${fileName}`;
          const info = await FileSystem.getInfoAsync(path).catch(() => null);
          if (!info?.exists) return;

          addFileToSnapshot(snapshot, {
            path,
            size: (info as any).size ?? 0,
            modifiedAt: getFileModifiedAt(info),
            ...parseCacheFile(dirName, fileName),
          });
        })
      );
    })
  );

  return snapshot;
};

const deleteCacheFiles = async (files: Iterable<CachedFile>) => {
  let removed = 0;
  await Promise.all(
    Array.from(files).map(async (file) => {
      removed += file.size;
      await FileSystem.deleteAsync(file.path, { idempotent: true }).catch(
        () => {}
      );
    })
  );
  return removed;
};

const cleanupUnexpectedFiles = async (
  snapshot: CacheSnapshot,
  expectedFormatsByLinkId: Map<number, Set<CacheFormat>>,
  canDeleteOrphans: boolean
) => {
  const filesToDelete = new Map<string, CachedFile>();

  for (const file of snapshot.partialFiles) {
    filesToDelete.set(file.path, file);
  }

  for (const [linkId, files] of snapshot.filesByLinkId) {
    const expectedFormats = expectedFormatsByLinkId.get(linkId);

    if (!expectedFormats) {
      if (canDeleteOrphans) {
        for (const file of files) filesToDelete.set(file.path, file);
      }
      continue;
    }

    for (const file of files) {
      if (file.format && !expectedFormats.has(file.format)) {
        filesToDelete.set(file.path, file);
      }
    }
  }

  return deleteCacheFiles(filesToDelete.values());
};

const formatsForLink = (
  link: LinkIncludingShortenedCollectionAndTags
): CacheFormat[] => {
  const formats: CacheFormat[] = [];

  if (formatAvailable(link, "preview")) formats.push("preview");
  if (formatAvailable(link, "readable")) formats.push("readable");
  if (formatAvailable(link, "monolith")) formats.push("webpage");
  if (formatAvailable(link, "pdf")) formats.push("pdf");
  if (formatAvailable(link, "image")) {
    const image =
      typeof link.image === "string" ? link.image.toLowerCase() : "";
    if (image.split("?")[0].endsWith("png")) {
      formats.push("png");
    } else {
      formats.push("jpeg");
    }
  }

  return formats;
};

const missingFormatsForLink = (
  link: LinkIncludingShortenedCollectionAndTags & { id: number },
  snapshot: CacheSnapshot
): CacheFormat[] => {
  const formats = formatsForLink(link);
  const cachedFormats = snapshot.formatsByLinkId.get(link.id);
  const linkFreshnessTime = getLinkFreshnessTime(link);

  return formats.filter((format) => {
    const file = cachedFormats?.get(format);
    if (!file) return true;

    return Boolean(
      linkFreshnessTime &&
        file.modifiedAt &&
        file.modifiedAt + staleFileGraceMs < linkFreshnessTime
    );
  });
};

const downloadLinkFormats = async (
  link: LinkIncludingShortenedCollectionAndTags & { id: number },
  formats: CacheFormat[],
  auth: MobileAuth,
  userContentDomain: string | null | undefined
) => {
  const concurrency = 2;

  for (let i = 0; i < formats.length; i += concurrency) {
    if (cancelled) return;

    const slice = formats.slice(i, i + concurrency);
    await Promise.all(
      slice.map(async (format) => {
        try {
          const { delta } = await fetchFormatToCache({
            link: { id: link.id, updatedAt: link.updatedAt },
            format,
            auth,
            userContentDomain,
          });
          useOfflineSyncStore.getState().addBytes(delta);
        } catch (e) {
          console.warn(
            `[offlineSync] Failed to cache link ${link.id} format ${format}`,
            e
          );
          useOfflineSyncStore.getState().incrementFailed();
        }
      })
    );
  }
};

export const startSync = async (
  auth: MobileAuth,
  userContentDomain: string | null | undefined
) => {
  const generation = ++syncGeneration;
  activeAuth = auth;
  activeUserContentDomain = userContentDomain;

  if (runPromise) {
    cancelled = true;
    await runPromise;
    if (generation !== syncGeneration) return;
  }

  const net = await NetInfo.fetch();
  if (generation !== syncGeneration) return;
  if (!isOnline(net)) {
    useOfflineSyncStore.getState().setStatus("paused");
    return;
  }

  cancelled = false;

  const store = useOfflineSyncStore.getState();
  store.setStatus("syncing");

  const currentRun = (async () => {
    try {
      const { links, hasLinkSource } = getLinksFromCache();
      const cacheSnapshot = await scanCacheSnapshot();
      const expectedFormatsByLinkId = new Map<number, Set<CacheFormat>>();

      for (const link of links) {
        if (typeof link.id !== "number") continue;
        expectedFormatsByLinkId.set(link.id, new Set(formatsForLink(link)));
      }

      const removedBytes = await cleanupUnexpectedFiles(
        cacheSnapshot,
        expectedFormatsByLinkId,
        hasLinkSource
      );
      store.setBytesUsed(Math.max(0, cacheSnapshot.bytesUsed - removedBytes));

      store.setProgress(0, links.length);

      for (const link of links) {
        if (cancelled || generation !== syncGeneration) break;
        if (link.id === undefined) continue;

        const fullLink = link as LinkIncludingShortenedCollectionAndTags & {
          id: number;
        };

        setCachedLinkQueryData(fullLink);

        const missing = missingFormatsForLink(fullLink, cacheSnapshot);
        if (missing.length === 0) {
          store.incrementProcessed();
          continue;
        }

        store.setCurrentLinkId(fullLink.id);
        await downloadLinkFormats(fullLink, missing, auth, userContentDomain);
        store.incrementProcessed();
      }
    } catch (e) {
      console.error("[offlineSync] Sync failed", e);
    } finally {
      const currentStore = useOfflineSyncStore.getState();
      currentStore.setCurrentLinkId(null);
      if (generation === syncGeneration && currentStore.status !== "paused") {
        currentStore.setStatus("idle");
      }
    }
  })();

  runPromise = currentRun;

  try {
    await currentRun;
  } finally {
    if (runPromise === currentRun) runPromise = null;
  }
};

export const stopSync = () => {
  syncGeneration += 1;
  cancelled = true;
  activeAuth = null;
  activeUserContentDomain = undefined;
  const store = useOfflineSyncStore.getState();
  store.setCurrentLinkId(null);
  if (store.status !== "idle") store.setStatus("idle");
};

export const recomputeStorage = async () => {
  const bytes = await getCacheSize();
  useOfflineSyncStore.getState().setBytesUsed(bytes);
};

export const subscribeToConnectivity = () => {
  if (netUnsubscribe) return;

  netUnsubscribe = NetInfo.addEventListener((state) => {
    const store = useOfflineSyncStore.getState();
    if (!isOnline(state)) {
      if (runPromise) {
        cancelled = true;
        store.setStatus("paused");
      }
    } else {
      if (store.status === "paused" && activeAuth && !runPromise) {
        startSync(activeAuth, activeUserContentDomain);
      }
    }
  });
};

export const subscribeToQueryCache = () => {
  if (cacheUnsubscribe) return;

  cacheUnsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (syncQueryWriteDepth > 0) return;

    const key = event.query.queryKey[0];
    if (key !== "links" && key !== "dashboardData" && key !== "link") return;
    if (!activeAuth) return;

    if (cacheSyncTimeout) clearTimeout(cacheSyncTimeout);
    cacheSyncTimeout = setTimeout(() => {
      if (activeAuth) startSync(activeAuth, activeUserContentDomain);
    }, 1500);
  });
};

export const unsubscribeFromQueryCache = () => {
  cacheUnsubscribe?.();
  cacheUnsubscribe = null;
  if (cacheSyncTimeout) clearTimeout(cacheSyncTimeout);
  cacheSyncTimeout = null;
};

export const unsubscribeFromConnectivity = () => {
  netUnsubscribe?.();
  netUnsubscribe = null;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};
