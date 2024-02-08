import useAccountStore from "@/store/account";
import { ArchivedFormat, LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { LinksRouteTo } from "@prisma/client";

export const generateLinkHref = (link: LinkIncludingShortenedCollectionAndTags): string => {
	const { account } = useAccountStore();

	switch (account.linksRouteTo) {
		case LinksRouteTo.ORIGINAL:
			return link.url || '';
		case LinksRouteTo.PDF:
			return `/preserved/${link?.id}?format=${ArchivedFormat.pdf}`;
		case LinksRouteTo.READABLE:
			return `/preserved/${link?.id}?format=${ArchivedFormat.readability}`;
		case LinksRouteTo.SCREENSHOT:
			return `/preserved/${link?.id}?format=${link?.image?.endsWith("png") ? ArchivedFormat.png : ArchivedFormat.jpeg}`;
		default:
			return link.url || '';
	}
};