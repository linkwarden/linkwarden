import { ArchivedFormat } from "@/types/global";

export default function getSuffixFromFormat(format: number): string | null {
  switch (format) {
    case ArchivedFormat.png:
      return ".png";
    case ArchivedFormat.jpeg:
      return ".jpeg";
    case ArchivedFormat.pdf:
      return ".pdf";
    case ArchivedFormat.readability:
      return "_readability.json";
    case ArchivedFormat.monolith:
      return ".html";
    default:
      return null;
  }
}
