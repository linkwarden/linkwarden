import * as FileSystem from "expo-file-system";

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

  await Promise.all([
    FileSystem.deleteAsync(readablePath, { idempotent: true }),
    FileSystem.deleteAsync(webpagePath, { idempotent: true }),
    FileSystem.deleteAsync(jpegPath, { idempotent: true }),
    FileSystem.deleteAsync(pngPath, { idempotent: true }),
    FileSystem.deleteAsync(pdfPath, { idempotent: true }),
  ]);
};
