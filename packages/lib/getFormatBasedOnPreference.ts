import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
import { LinksRouteTo } from "@linkwarden/prisma/client";
import { formatAvailable } from "@linkwarden/lib/formatStats";

const getFormatBasedOnPreference = ({
  link,
  preference,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  preference: LinksRouteTo;
}) => {
  // Return the format based on the account's preference
  // If the user's preference is not available, return null (original url)

  if (preference === LinksRouteTo.ORIGINAL && link.type === "url") {
    return null;
  } else if (preference === LinksRouteTo.PDF || link.type === "pdf") {
    if (!formatAvailable(link, "pdf")) return null;

    return ArchivedFormat.pdf;
  } else if (preference === LinksRouteTo.READABLE && link.type === "url") {
    if (!formatAvailable(link, "readable")) return null;

    return ArchivedFormat.readability;
  } else if (preference === LinksRouteTo.SCREENSHOT || link.type === "image") {
    if (!formatAvailable(link, "image")) return null;

    return link?.image?.endsWith("png")
      ? ArchivedFormat.png
      : ArchivedFormat.jpeg;
  } else if (preference === LinksRouteTo.MONOLITH) {
    if (!formatAvailable(link, "monolith")) return null;

    return ArchivedFormat.monolith;
  } else {
    return null;
  }
};

export default getFormatBasedOnPreference;
