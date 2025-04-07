import { ArchivedFormat } from "@/types/global";

const getFormatFromContentType = (contentType: string): ArchivedFormat => {
  switch (contentType) {
    case "image/jpg":
    case "image/jpeg":
      return ArchivedFormat.jpeg;
    case "image/png":
      return ArchivedFormat.png;
    case "application/pdf":
      return ArchivedFormat.pdf;
    case "text/html":
      return ArchivedFormat.monolith;
    case "text/plain":
      return ArchivedFormat.readability;
    default:
      throw new Error("Invalid file type.");
  }
};

export default getFormatFromContentType;
