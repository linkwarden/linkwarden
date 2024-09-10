import { useState } from "react";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import usePermissions from "@/hooks/usePermissions";
import DeleteLinkModal from "@/components/ModalContent/DeleteLinkModal";
import { dropdownTriggerer } from "@/lib/client/utils";
import { useTranslation } from "next-i18next";
import { useUser } from "@/hooks/store/user";
import { useDeleteLink, useGetLink, useUpdateLink } from "@/hooks/store/links";
import toast from "react-hot-toast";
import LinkModal from "@/components/ModalContent/LinkModal";
import { useRouter } from "next/router";
import clsx from "clsx";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  collection: CollectionIncludingMembersAndLinkCount;
  className?: string;
  btnStyle?: string;
};

export default function LinkActions({ link, className, btnStyle }: Props) {
  const { t } = useTranslation();

  const permissions = usePermissions(link.collection.id as number);
  const getLink = useGetLink();

  const [editLinkModal, setEditLinkModal] = useState(false);
  const [linkModal, setLinkModal] = useState(false);
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
          className={clsx(
            className || "top-3 right-3",
            "absolute z-20",
            btnStyle
          )}
          tabIndex={0}
          role="button"
          onMouseDown={dropdownTriggerer}
          onClick={() => setLinkModal(true)}
        >
          <div className="btn btn-sm btn-square text-neutral">
            <i title="More" className="bi-three-dots text-xl" />
          </div>
        </div>
      ) : (
        <div
          className={`dropdown dropdown-left absolute ${
            className || "top-3 right-3"
          } z-20`}
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
              "dropdown-content z-[20] menu shadow bg-base-200 border border-neutral-content rounded-box mr-1"
            }
          >
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
            {link.type === "url" && permissions === true && (
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
        <LinkModal
          onClose={() => setEditLinkModal(false)}
          onPin={pinLink}
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
          onPin={pinLink}
          onUpdateArchive={updateArchive}
          onDelete={() => setDeleteLinkModal(true)}
          link={link}
        />
      )}
    </>
  );
}
