import { useState } from "react";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import usePermissions from "@/hooks/usePermissions";
import DeleteLinkModal from "@/components/ModalContent/DeleteLinkModal";
import { dropdownTriggerer } from "@/lib/client/utils";
import { useTranslation } from "next-i18next";
import { useDeleteLink, useGetLink } from "@/hooks/store/links";
import toast from "react-hot-toast";
import LinkModal from "@/components/ModalContent/LinkModal";
import { useRouter } from "next/router";
import clsx from "clsx";
import usePinLink from "@/lib/client/pinLink";

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
  const getLink = useGetLink();

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

  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  return (
    <>
      {isPublicRoute ? (
        <div
          className="absolute top-3 right-3 group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 duration-100"
          onMouseDown={dropdownTriggerer}
          onClick={() => setLinkModal(true)}
        >
          <div className={clsx("btn btn-sm btn-square text-neutral", btnStyle)}>
            <i title="More" className="bi-info-circle text-xl" />
          </div>
        </div>
      ) : (
        <div
          className={`dropdown dropdown-end absolute top-3 right-3 group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 duration-100 z-20`}
        >
          <div
            tabIndex={0}
            role="button"
            onMouseDown={dropdownTriggerer}
            className={clsx("btn btn-sm btn-square text-neutral", btnStyle)}
          >
            <i title="More" className="bi-three-dots text-xl" />
          </div>
          <ul
            className={
              "dropdown-content z-[20] menu shadow bg-base-200 border border-neutral-content rounded-box mt-1"
            }
          >
            <li>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  (document?.activeElement as HTMLElement)?.blur();
                  pinLink(link);
                }}
                className="whitespace-nowrap"
              >
                {link?.pinnedBy && link.pinnedBy[0]
                  ? t("unpin")
                  : t("pin_to_dashboard")}
              </div>
            </li>
            <li>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  (document?.activeElement as HTMLElement)?.blur();
                  setLinkModal(true);
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
