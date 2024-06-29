import {
  AccountSettings,
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { LinksRouteTo } from "@prisma/client";
import {
  pdfAvailable,
  readabilityAvailable,
  screenshotAvailable,
  monolithAvailable,
} from "../shared/getArchiveValidity";

export const generateLinkHref = (
  link: LinkIncludingShortenedCollectionAndTags,
  account: AccountSettings
): string => {
  // Return the links href based on the account's preference
  // If the user's preference is not available, return the original link
  if (account.linksRouteTo === LinksRouteTo.ORIGINAL && link.type === "url") {
    return link.url || "";
  } else if (account.linksRouteTo === LinksRouteTo.PDF || link.type === "pdf") {
    if (!pdfAvailable(link)) return link.url || "";

    return `/preserved/${link?.id}?format=${ArchivedFormat.pdf}`;
  } else if (
    account.linksRouteTo === LinksRouteTo.READABLE &&
    link.type === "url"
  ) {
    if (!readabilityAvailable(link)) return link.url || "";

    return `/preserved/${link?.id}?format=${ArchivedFormat.readability}`;
  } else if (
    account.linksRouteTo === LinksRouteTo.SCREENSHOT ||
    link.type === "image"
  ) {
    if (!screenshotAvailable(link)) return link.url || "";

    return `/preserved/${link?.id}?format=${
      link?.image?.endsWith("png") ? ArchivedFormat.png : ArchivedFormat.jpeg
    }`;
  } else if (account.linksRouteTo === LinksRouteTo.MONOLITH) {
    if (!monolithAvailable(link)) return link.url || "";

    return `/preserved/${link?.id}?format=${ArchivedFormat.monolith}`;
  } else {
    return link.url || "";
  }
};
