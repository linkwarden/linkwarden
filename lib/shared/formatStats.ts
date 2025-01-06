import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { Link } from "@prisma/client";

export function formatAvailable(
  link: Link | LinkIncludingShortenedCollectionAndTags,
  format: "image" | "pdf" | "readable" | "monolith" | "preview"
) {
  return link && link[format] && link[format] !== "unavailable";
}

export const atLeastOneFormatAvailable = (
  link: Link | LinkIncludingShortenedCollectionAndTags
) => {
  return (
    formatAvailable(link, "image") ||
    formatAvailable(link, "pdf") ||
    formatAvailable(link, "readable") ||
    formatAvailable(link, "monolith")
  );
};
