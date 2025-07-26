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
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  collection: CollectionIncludingMembersAndLinkCount;
  linkModal: boolean;
  className?: string;
  setLinkModal: (value: boolean) => void;
  ghost?: boolean;
  onLinkDropdownMenuOpen: (value: boolean) => void;
  dropdownMenuOpen: boolean;
};

export default function LinkActions({
  link,
  linkModal,
  className,
  setLinkModal,
  ghost,
  onLinkDropdownMenuOpen,
  dropdownMenuOpen,
}: Props) {
  const { t } = useTranslation();

  const permissions = usePermissions(link.collection.id as number);

  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public");

  const { refetch } = useGetLink({
    id: link.id as number,
    isPublicRoute,
  });

  const pinLink = usePinLink();

  const [editLinkModal, setEditLinkModal] = useState(false);
  const [deleteLinkModal, setDeleteLinkModal] = useState(false);
  const [refreshPreservationsModal, setRefreshPreservationsModal] =
    useState(false);

  const deleteLink = useDeleteLink();

  const updateArchive = async () => {
    const load = toast.loading(t("sending_request"));

    const response = await fetch(`/api/v1/links/${link?.id}/archive`, {
      method: "PUT",
    });

    const data = await response.json();
    toast.dismiss(load);

    if (response.ok) {
      refetch().catch((error) => {
        console.error("Error fetching link:", error);
      });

      toast.success(t("link_being_archived"));
    } else toast.error(data.response);
  };

  return (
    <>
      {isPublicRoute ? (
        <Button
          variant={ghost ? "ghost" : "simple"}
          size="icon"
          className={clsx(className, "cursor-pointer")}
          onClick={() => setLinkModal(true)}
        >
          <i title="More" className="bi-info-circle text-xl" />
        </Button>
      ) : (
        <DropdownMenu
          open={dropdownMenuOpen}
          onOpenChange={onLinkDropdownMenuOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              asChild
              variant={ghost ? "ghost" : "simple"}
              size="icon"
              className={clsx(className, "cursor-pointer")}
              onMouseDown={(e) => e.preventDefault()}
            >
              <i title="More" className="bi-three-dots text-xl" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent sideOffset={4} align="end">
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
      {refreshPreservationsModal && (
        <ConfirmationModal
          toggleModal={() => {
            setRefreshPreservationsModal(false);
          }}
          onConfirmed={async () => {
            await updateArchive();
          }}
          title={t("refresh_preserved_formats")}
        >
          <p className="mb-5">
            {t("refresh_preserved_formats_confirmation_desc")}
          </p>
        </ConfirmationModal>
      )}
      {linkModal && (
        <LinkModal
          onClose={() => setLinkModal(false)}
          onPin={() => pinLink(link)}
          onUpdateArchive={() => setRefreshPreservationsModal(true)}
          onDelete={() => setDeleteLinkModal(true)}
          link={link}
        />
      )}
    </>
  );
}
