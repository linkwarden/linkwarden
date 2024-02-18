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
} from "../shared/getArchiveValidity";

export const generateLinkHref = (
  link: LinkIncludingShortenedCollectionAndTags,
  account: AccountSettings
): string => {
  // Return the links href based on the account's preference
  // If the user's preference is not available, return the original link
  switch (account.linksRouteTo) {
    case LinksRouteTo.ORIGINAL:
      return link.url || "";
    case LinksRouteTo.PDF:
      if (!pdfAvailable(link)) return link.url || "";

      return `/preserved/${link?.id}?format=${ArchivedFormat.pdf}`;
    case LinksRouteTo.READABLE:
      if (!readabilityAvailable(link)) return link.url || "";

      return `/preserved/${link?.id}?format=${ArchivedFormat.readability}`;
    case LinksRouteTo.SCREENSHOT:
      if (!screenshotAvailable(link)) return link.url || "";

      return `/preserved/${link?.id}?format=${
        link?.image?.endsWith("png") ? ArchivedFormat.png : ArchivedFormat.jpeg
      }`;
    default:
      return link.url || "";
  }
};
