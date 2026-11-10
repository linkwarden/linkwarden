import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import getFormatBasedOnPreference from "@linkwarden/lib/getFormatBasedOnPreference";
import { isDangerousLinkUrl } from "@linkwarden/lib/isDangerousLinkUrl";
import { LinksRouteTo } from "@linkwarden/prisma/client";

const openLink = (
  link: LinkIncludingShortenedCollectionAndTags,
  user: any,
  openModal: () => void,
  openScriptWarning: (url: string) => void
) => {
  if (user.linksRouteTo === LinksRouteTo.DETAILS) {
    openModal();
    return;
  }

  const format = getFormatBasedOnPreference({
    link,
    preference: user.linksRouteTo,
  });

  if (format !== null) {
    window.open(`/preserved/${link?.id}?format=${format}`, "_blank");
    return;
  }

  const url = link.url as string;

  const viewerCreatedLink = !!user?.id && user.id === link.createdById;

  if (isDangerousLinkUrl(url) && !viewerCreatedLink) {
    openScriptWarning(url);
    return;
  }

  window.open(url, "_blank");
};

export const openLinkUrl = (
  link: LinkIncludingShortenedCollectionAndTags,
  user: any,
  openScriptWarning: (url: string) => void
) => {
  const url = link.url;
  if (!url) return;

  const viewerCreatedLink = !!user?.id && user.id === link.createdById;

  if (isDangerousLinkUrl(url) && !viewerCreatedLink) {
    openScriptWarning(url);
    return;
  }

  window.open(url, "_blank");
};

export const handleLinkAnchorClick = (
  e: { preventDefault: () => void },
  link: LinkIncludingShortenedCollectionAndTags,
  user: any,
  openScriptWarning: (url: string) => void
) => {
  if (!link.url || !isDangerousLinkUrl(link.url)) return;
  e.preventDefault();
  openLinkUrl(link, user, openScriptWarning);
};

export default openLink;
