import moveFile from "./storage/moveFile";
import removeFile from "./storage/removeFile";

const removeFiles = async (linkId: number, collectionId: number) => {
  // PDF
  await removeFile({
    filePath: `archives/${collectionId}/${linkId}.pdf`,
  });
  // Images
  await removeFile({
    filePath: `archives/${collectionId}/${linkId}.png`,
  });
  await removeFile({
    filePath: `archives/${collectionId}/${linkId}.jpeg`,
  });
  await removeFile({
    filePath: `archives/${collectionId}/${linkId}.jpg`,
  });
  // HTML
  await removeFile({
    filePath: `archives/${collectionId}/${linkId}.html`,
  });
  // Preview
  await removeFile({
    filePath: `archives/preview/${collectionId}/${linkId}.jpeg`,
  });
  // Readability
  await removeFile({
    filePath: `archives/${collectionId}/${linkId}_readability.json`,
  });
};

const moveFiles = async (linkId: number, from: number, to: number) => {
  await moveFile(
    `archives/${from}/${linkId}.pdf`,
    `archives/${to}/${linkId}.pdf`
  );

  await moveFile(
    `archives/${from}/${linkId}.png`,
    `archives/${to}/${linkId}.png`
  );

  await moveFile(
    `archives/${from}/${linkId}.jpeg`,
    `archives/${to}/${linkId}.jpeg`
  );

  await moveFile(
    `archives/${from}/${linkId}.jpg`,
    `archives/${to}/${linkId}.jpg`
  );

  await moveFile(
    `archives/${from}/${linkId}.html`,
    `archives/${to}/${linkId}.html`
  );

  await moveFile(
    `archives/preview/${from}/${linkId}.jpeg`,
    `archives/preview/${to}/${linkId}.jpeg`
  );

  await moveFile(
    `archives/${from}/${linkId}_readability.json`,
    `archives/${to}/${linkId}_readability.json`
  );
};

export { removeFiles, moveFiles };
