import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";

// Don't use prisma client's LinksRouteTo, it'll crash in production (React Native)
type LinksRouteTo =
  | "ORIGINAL"
  | "PDF"
  | "READABLE"
  | "MONOLITH"
  | "SCREENSHOT"
  | "DETAILS";

const getFormatBasedOnPreference = ({
  link,
  preference,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  preference: LinksRouteTo;
}) => {
  // Return the format based on the account's preference
  // If the user's preference is not available, return null (original url)

  if (preference === "ORIGINAL" && link.type === "url") {
    return null;
  } else if (preference === "PDF" || link.type === "pdf") {
    if (!link.pdf || link.pdf === "unavailable") return null;

    return ArchivedFormat.pdf;
  } else if (preference === "READABLE" && link.type === "url") {
    if (!link.readable || link.readable === "unavailable") return null;

    return ArchivedFormat.readability;
  } else if (preference === "SCREENSHOT" || link.type === "image") {
    if (!link.image || link.image === "unavailable") return null;

    return link?.image?.endsWith("png")
      ? ArchivedFormat.png
      : ArchivedFormat.jpeg;
  } else if (preference === "MONOLITH") {
    if (!link.monolith || link.monolith === "unavailable") return null;

    return ArchivedFormat.monolith;
  } else {
    return null;
  }
};

export default getFormatBasedOnPreference;
