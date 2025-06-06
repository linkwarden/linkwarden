import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import { Link } from "@linkwarden/prisma/client";

export function formatAvailable(
  link: Link | LinkIncludingShortenedCollectionAndTags,
  format: "image" | "pdf" | "readable" | "monolith" | "preview"
) {
  return Boolean(link && link[format] && link[format] !== "unavailable");
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
