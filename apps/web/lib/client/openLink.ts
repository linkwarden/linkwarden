import {
  AccountSettings,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
import { generateLinkHref } from "@linkwarden/lib/generateLinkHref";
import { LinksRouteTo } from "@linkwarden/prisma/client";
import { toast } from "react-hot-toast";

const openLink = (
  link: LinkIncludingShortenedCollectionAndTags,
  user: any,
  openModal: () => void
) => {
  if (user.linksRouteTo === LinksRouteTo.DETAILS) {
    openModal();
  } else if (user.linksRouteTo === LinksRouteTo.COPY) {
    if (link.url) {
      navigator.clipboard.writeText(link.url);
      // non-react > string required for user feedback
      toast.success("Copied to clipboard");
    }
  } else {
    window.open(generateLinkHref(link, user), "_blank");
  }
};

export default openLink;
