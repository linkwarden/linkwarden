import { useUpdateLink } from "@linkwarden/router/links";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { useUser } from "@linkwarden/router/user";

const usePinLink = () => {
  const { t } = useTranslation();
  const updateLink = useUpdateLink();
  const { data: user } = useUser();

  // Return a function that can be used to pin/unpin the link
  const pinLink = async (link: LinkIncludingShortenedCollectionAndTags) => {
    const isAlreadyPinned = link?.pinnedBy && link.pinnedBy[0] ? true : false;

    const toastId = toast.loading(t("updating"));

    try {
      await updateLink.mutateAsync(
        {
          ...link,
          pinnedBy: (isAlreadyPinned
            ? [{ id: undefined }]
            : [{ id: user?.id }]) as any,
        },
        {
          onSettled: (data, error) => {
            if (error) {
              toast.error(error.message, { id: toastId });
            } else {
              toast.success(
                isAlreadyPinned ? t("link_unpinned") : t("link_pinned"),
                {
                  id: toastId,
                }
              );
            }
          },
        }
      );
    } catch (e) {
      toast.dismiss(toastId);
      console.error(e);
    }
  };

  return pinLink;
};

export default usePinLink;
