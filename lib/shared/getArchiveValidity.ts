import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { Link } from "@prisma/client";

export function formatAvailable(
  link: Link | LinkIncludingShortenedCollectionAndTags,
  format: "image" | "pdf" | "readable" | "monolith" | "preview"
) {
  return (
    link &&
    link[format] &&
    link[format] !== "pending" &&
    link[format] !== "unavailable"
  );
}

export function formatStatus(
  link: Link | LinkIncludingShortenedCollectionAndTags,
  format: "image" | "pdf" | "readable" | "monolith" | "preview"
): "pending" | "processed" | "error" {
  // Before getting passed to the archive handler...
  if (!link[format]) {
    return "pending";
  } else if (
    link[format].startsWith("unavailable") ||
    link[format].startsWith("archive")
  ) {
    return "processed";
  } else if (link[format].startsWith("pending")) {
    return "pending";
  } else {
    return "error";
  }
}
