import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { Link } from "@prisma/client";

export function formatAvailable(
  link: Link | LinkIncludingShortenedCollectionAndTags,
  format: "image" | "pdf" | "readable" | "monolith" | "preview"
) {
  return link && link[format] && link[format] !== "unavailable";
}
