import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import getFormatBasedOnPreference from "@linkwarden/lib/getFormatBasedOnPreference";
import { LinksRouteTo } from "@linkwarden/prisma/client";

const openLink = (
  link: LinkIncludingShortenedCollectionAndTags,
  user: any,
  openModal: () => void
) => {
  if (user.linksRouteTo === LinksRouteTo.DETAILS) {
    openModal();
  } else {
    const format = getFormatBasedOnPreference({
      link,
      preference: user.linksRouteTo,
    });

    window.open(
      format !== null
        ? `/preserved/${link?.id}?format=${format}`
        : (link.url as string),
      "_blank"
    );
  }
};

export default openLink;
