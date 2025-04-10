import { useUpdateLink } from "@/hooks/store/links";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { useUser } from "@/hooks/store/user";

const usePinLink = () => {
  const { t } = useTranslation();
  const updateLink = useUpdateLink();
  const { data: user = {} } = useUser();

  // Return a function that can be used to pin/unpin the link
  const pinLink = async (link: LinkIncludingShortenedCollectionAndTags) => {
    const isAlreadyPinned = link?.pinnedBy && link.pinnedBy[0] ? true : false;

    const load = toast.loading(t("updating"));

    try {
      await updateLink.mutateAsync(
        {
          ...link,
          pinnedBy: isAlreadyPinned ? [{ id: undefined }] : [{ id: user.id }],
        },
        {
          onSettled: (data, error) => {
            toast.dismiss(load);

            if (error) {
              toast.error(error.message);
            } else {
              toast.success(
                isAlreadyPinned ? t("link_unpinned") : t("link_pinned")
              );
            }
          },
        }
      );
    } catch (e) {
      toast.dismiss(load);
      console.error(e);
    }
  };

  return pinLink;
};

export default usePinLink;
