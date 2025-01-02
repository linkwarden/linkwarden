import {
  AccountSettings,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { generateLinkHref } from "./generateLinkHref";
import { LinksRouteTo } from "@prisma/client";

const openLink = (
  link: LinkIncludingShortenedCollectionAndTags,
  user: AccountSettings,
  openModal: () => void
) => {
  if (user.linksRouteTo === LinksRouteTo.DETAILS) {
    openModal();
  } else {
    window.open(generateLinkHref(link, user), "_blank");
  }
};

export default openLink;
