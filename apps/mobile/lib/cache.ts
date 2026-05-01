import * as FileSystem from "expo-file-system/legacy";
import NetInfo from "@react-native-community/netinfo";

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
  const readablePath =
    FileSystem.documentDirectory + `archivedData/readable/link_${linkId}.html`;
  const webpagePath =
    FileSystem.documentDirectory + `archivedData/webpage/link_${linkId}.html`;
  const jpegPath =
    FileSystem.documentDirectory + `archivedData/jpeg/link_${linkId}.jpeg`;
  const pngPath =
    FileSystem.documentDirectory + `archivedData/png/link_${linkId}.png`;
  const pdfPath =
    FileSystem.documentDirectory + `archivedData/pdf/link_${linkId}.pdf`;
  const previewPath =
    FileSystem.documentDirectory + `archivedData/previews/link_${linkId}.jpg`;

  await Promise.all([
    FileSystem.deleteAsync(readablePath, { idempotent: true }),
    FileSystem.deleteAsync(webpagePath, { idempotent: true }),
    FileSystem.deleteAsync(jpegPath, { idempotent: true }),
    FileSystem.deleteAsync(pngPath, { idempotent: true }),
    FileSystem.deleteAsync(pdfPath, { idempotent: true }),
    FileSystem.deleteAsync(previewPath, { idempotent: true }),
  ]);
};
