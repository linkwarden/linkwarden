import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
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

export const isPreservationPending = (
  link?: Partial<Link> | LinkIncludingShortenedCollectionAndTags | null
) =>
  Boolean(
    link &&
      typeof link.id === "number" &&
      link.id > 0 &&
      link.url &&
      !link.lastPreserved
  );

/**
 * Optimistic (just-added) links carry a temporary negative id and only exist
 * in the local cache until the create mutation resolves. While one is present
 * we must avoid full-list refetches, which would replace the cache with a
 * server snapshot that doesn't include it yet, making it flash out and back in.
 */
export const hasOptimisticLink = (
  links: (Partial<Link> | LinkIncludingShortenedCollectionAndTags)[]
) => links.some((e) => typeof e.id === "number" && e.id < 0);

export const anyPreservationPending = (
  links: (Partial<Link> | LinkIncludingShortenedCollectionAndTags)[]
) => !hasOptimisticLink(links) && links.some(isPreservationPending);
