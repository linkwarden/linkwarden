import {
  AccountSettings,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { generateLinkHref } from "./generateLinkHref";
import { LinksRouteTo } from "@prisma/client";

const openLink = (
  link: LinkIncludingShortenedCollectionAndTags,
  user: AccountSettings
) => {
  if (user.linksRouteTo === LinksRouteTo.DETAILS) {
  } else {
    window.open(generateLinkHref(link, user), "_blank");
  }
};

export default openLink;
