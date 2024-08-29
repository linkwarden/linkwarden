import { useState } from "react";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import usePermissions from "@/hooks/usePermissions";
import EditLinkModal from "@/components/ModalContent/EditLinkModal";
import DeleteLinkModal from "@/components/ModalContent/DeleteLinkModal";
import { dropdownTriggerer } from "@/lib/client/utils";
import { useTranslation } from "next-i18next";
import { useUser } from "@/hooks/store/user";
import { useDeleteLink, useGetLink, useUpdateLink } from "@/hooks/store/links";
import toast from "react-hot-toast";
import LinkDetailModal from "@/components/ModalContent/LinkDetailModal";
import { useRouter } from "next/router";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  collection: CollectionIncludingMembersAndLinkCount;
  position?: string;
  alignToTop?: boolean;
  flipDropdown?: boolean;
};

export default function LinkActions({
  link,
  position,
  alignToTop,
  flipDropdown,
}: Props) {
  const { t } = useTranslation();

  const permissions = usePermissions(link.collection.id as number);
  const getLink = useGetLink();

  const [editLinkModal, setEditLinkModal] = useState(false);
  const [linkDetailModal, setLinkDetailModal] = useState(false);
  const [deleteLinkModal, setDeleteLinkModal] = useState(false);

  const { data: user = {} } = useUser();

  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();

  const pinLink = async () => {
    const isAlreadyPinned = link?.pinnedBy && link.pinnedBy[0] ? true : false;

    const load = toast.loading(t("updating"));

    await updateLink.mutateAsync(
      {
        ...link,
        pinnedBy: isAlreadyPinned ? undefined : [{ id: user.id }],
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
  };

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

  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  return (
    <>
      {isPublicRoute ? (
        <div
          className={`absolute ${position || "top-3 right-3"} ${
            alignToTop ? "" : "dropdown-end"
          } z-20`}
          onClick={() => setLinkDetailModal(true)}
        >
          <div className="btn btn-ghost btn-sm btn-square text-neutral">
            <i title="More" className="bi-three-dots text-xl" />
          </div>
        </div>
      ) : (
        <div
          className={`dropdown dropdown-left absolute ${
            position || "top-3 right-3"
          } ${alignToTop ? "" : "dropdown-end"} z-20`}
        >
          <div
            tabIndex={0}
            role="button"
            onMouseDown={dropdownTriggerer}
            className="btn btn-ghost btn-sm btn-square text-neutral"
          >
            <i title="More" className="bi-three-dots text-xl" />
          </div>
          <ul
            className={`dropdown-content z-[20] menu shadow bg-base-200 border border-neutral-content rounded-box mr-1 ${
              alignToTop ? "" : "translate-y-10"
            }`}
          >
            {(permissions === true || permissions?.canUpdate) && (
              <li>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    (document?.activeElement as HTMLElement)?.blur();
                    pinLink();
                  }}
                  className="whitespace-nowrap"
                >
                  {link?.pinnedBy && link.pinnedBy[0]
                    ? t("unpin")
                    : t("pin_to_dashboard")}
                </div>
              </li>
            )}
            <li>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  (document?.activeElement as HTMLElement)?.blur();
                  setLinkDetailModal(true);
                }}
                className="whitespace-nowrap"
              >
                {t("show_link_details")}
              </div>
            </li>
            {(permissions === true || permissions?.canUpdate) && (
              <li>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    (document?.activeElement as HTMLElement)?.blur();
                    setEditLinkModal(true);
                  }}
                  className="whitespace-nowrap"
                >
                  {t("edit_link")}
                </div>
              </li>
            )}
            {link.type === "url" && (
              <li>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    (document?.activeElement as HTMLElement)?.blur();
                    updateArchive();
                  }}
                  className="whitespace-nowrap"
                >
                  {t("refresh_preserved_formats")}
                </div>
              </li>
            )}
            {(permissions === true || permissions?.canDelete) && (
              <li>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={async (e) => {
                    (document?.activeElement as HTMLElement)?.blur();
                    console.log(e.shiftKey);
                    e.shiftKey
                      ? (async () => {
                          const load = toast.loading(t("deleting"));

                          await deleteLink.mutateAsync(link.id as number, {
                            onSettled: (data, error) => {
                              toast.dismiss(load);

                              if (error) {
                                toast.error(error.message);
                              } else {
                                toast.success(t("deleted"));
                              }
                            },
                          });
                        })()
                      : setDeleteLinkModal(true);
                  }}
                  className="whitespace-nowrap"
                >
                  {t("delete")}
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
      {editLinkModal && (
        <EditLinkModal
          onClose={() => setEditLinkModal(false)}
          activeLink={link}
        />
      )}
      {deleteLinkModal && (
        <DeleteLinkModal
          onClose={() => setDeleteLinkModal(false)}
          activeLink={link}
        />
      )}
      {linkDetailModal && (
        <LinkDetailModal
          onClose={() => setLinkDetailModal(false)}
          onEdit={() => setEditLinkModal(true)}
          onPin={pinLink}
          onUpdateArchive={updateArchive}
          onDelete={() => setDeleteLinkModal(true)}
          link={link}
        />
      )}
    </>
  );
}
