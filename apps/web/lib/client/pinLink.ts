import { useUpdateLink } from "@linkwarden/router/links";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { useUser } from "@linkwarden/router/user";

const usePinLink = () => {
  const { t } = useTranslation();
  const updateLink = useUpdateLink({ toast, t });
  const { data: user } = useUser();

  // Return a function that can be used to pin/unpin the link
  const pinLink = async (link: LinkIncludingShortenedCollectionAndTags) => {
    const isAlreadyPinned = link?.pinnedBy && link.pinnedBy[0] ? true : false;

    try {
      updateLink.mutateAsync({
        ...link,
        pinnedBy: (isAlreadyPinned
          ? [{ id: undefined }]
          : [{ id: user?.id }]) as any,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return pinLink;
};

export default usePinLink;
