import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";

const getOriginalFormat = (
  link: LinkIncludingShortenedCollectionAndTags
): ArchivedFormat | string | null => {
  if (link.url && link.type === "url") return link.url;
  else if (link.type === "pdf") return ArchivedFormat.pdf;
  else if (link.type === "image")
    return link.image?.endsWith("png")
      ? ArchivedFormat.png
      : ArchivedFormat.jpeg;
  else return null;
};

export default getOriginalFormat;
