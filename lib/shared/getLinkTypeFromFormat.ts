import { ArchivedFormat } from "@/types/global";

const getLinkTypeFromFormat = (
  format: ArchivedFormat
): "image" | "pdf" | "readable" | "monolith" => {
  switch (format) {
    case ArchivedFormat.readability:
      return "readable";
    case ArchivedFormat.monolith:
      return "monolith";
    case ArchivedFormat.jpeg:
    case ArchivedFormat.png:
      return "image";
    case ArchivedFormat.pdf:
      return "pdf";
    default:
      throw new Error("Invalid file type.");
  }
};

export default getLinkTypeFromFormat;
