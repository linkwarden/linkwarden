import { useState } from "react";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
import usePermissions from "@/hooks/usePermissions";
import DeleteLinkModal from "@/components/ModalContent/DeleteLinkModal";
import { useTranslation } from "next-i18next";
import { useDeleteLink, useGetLink } from "@linkwarden/router/links";
import toast from "react-hot-toast";
import LinkModal from "@/components/ModalContent/LinkModal";
import { useRouter } from "next/router";
import clsx from "clsx";
import usePinLink from "@/lib/client/pinLink";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  collection: CollectionIncludingMembersAndLinkCount;
  btnStyle?: string;
  linkModal: boolean;
  setLinkModal: (value: boolean) => void;
};

export default function LinkActions({
  link,
  btnStyle,
  linkModal,
  setLinkModal,
}: Props) {
  const { t } = useTranslation();

  const permissions = usePermissions(link.collection.id as number);

  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  const getLink = useGetLink(isPublicRoute);

  const pinLink = usePinLink();

  const [editLinkModal, setEditLinkModal] = useState(false);
  const [deleteLinkModal, setDeleteLinkModal] = useState(false);

  const deleteLink = useDeleteLink();

  const updateArchive = async () => {
    const load = toast.loading(t("sending_request"));

    const response = await fetch(`/api/v1/links/${link?.id}/archive`, {
      method: "PUT",
    });

    const data = await response.json();
    toast.dismiss(load);

    if (response.ok) {
      await getLink.mutateAsync({ id: link.id as number });

      toast.success(t("link_being_archived"));
    } else toast.error(data.response);
  };

  return (
    <>
      {isPublicRoute ? (
        <div
          className="absolute top-3 right-3 group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 duration-100 text-neutral z-20 focus:outline-none"
          onClick={() => setLinkModal(true)}
        >
          <div className={clsx("btn btn-sm btn-square text-neutral", btnStyle)}>
            <i title="More" className="bi-info-circle text-xl" />
          </div>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onMouseDown={(e) => e.preventDefault()}
              className={clsx(
                "absolute top-3 right-3 group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 duration-100 btn btn-sm btn-square text-neutral z-20 focus:outline-none",
                btnStyle
              )}
            >
              <i title="More" className="bi-three-dots text-xl" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent sideOffset={4} align="end" className="mt-1">
            <DropdownMenuItem onSelect={() => pinLink(link)}>
              <i className="bi-pin" />

              {link.pinnedBy && link.pinnedBy.length > 0
                ? t("unpin")
                : t("pin_to_dashboard")}
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => setLinkModal(true)}>
              <i className="bi-info-circle" />

              {t("show_link_details")}
            </DropdownMenuItem>

            {(permissions === true || permissions?.canUpdate) && (
              <DropdownMenuItem onSelect={() => setEditLinkModal(true)}>
                <i className="bi-pencil-square" />

                {t("edit_link")}
              </DropdownMenuItem>
            )}

            {(permissions === true || permissions?.canDelete) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-error"
                  onSelect={async (e) => {
                    if ((e as any).shiftKey) {
                      const load = toast.loading(t("deleting"));
                      await deleteLink.mutateAsync(link.id as number, {
                        onSettled: (data, error) => {
                          toast.dismiss(load);
                          if (error) toast.error(error.message);
                          else toast.success(t("deleted"));
                        },
                      });
                    } else {
                      setDeleteLinkModal(true);
                    }
                  }}
                >
                  <i className="bi-trash" />

                  {t("delete")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {editLinkModal && (
        <LinkModal
          onClose={() => setEditLinkModal(false)}
          onPin={() => pinLink(link)}
          onUpdateArchive={updateArchive}
          onDelete={() => setDeleteLinkModal(true)}
          link={link}
          activeMode="edit"
        />
      )}
      {deleteLinkModal && (
        <DeleteLinkModal
          onClose={() => setDeleteLinkModal(false)}
          activeLink={link}
        />
      )}
      {linkModal && (
        <LinkModal
          onClose={() => setLinkModal(false)}
          onPin={() => pinLink(link)}
          onUpdateArchive={updateArchive}
          onDelete={() => setDeleteLinkModal(true)}
          link={link}
        />
      )}
    </>
  );
}
