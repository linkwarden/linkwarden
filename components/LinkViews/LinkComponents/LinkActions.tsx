import { useState } from "react";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import usePermissions from "@/hooks/usePermissions";
import EditLinkModal from "@/components/ModalContent/EditLinkModal";
import DeleteLinkModal from "@/components/ModalContent/DeleteLinkModal";
import PreservedFormatsModal from "@/components/ModalContent/PreservedFormatsModal";
import { dropdownTriggerer } from "@/lib/client/utils";
import { useTranslation } from "next-i18next";
import { useUser } from "@/hooks/store/user";
import { useDeleteLink, useUpdateLink } from "@/hooks/store/links";
import toast from "react-hot-toast";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  collection: CollectionIncludingMembersAndLinkCount;
  position?: string;
  toggleShowInfo?: () => void;
  linkInfo?: boolean;
  alignToTop?: boolean;
  flipDropdown?: boolean;
};

export default function LinkActions({
  link,
  toggleShowInfo,
  position,
  linkInfo,
  alignToTop,
  flipDropdown,
}: Props) {
  const { t } = useTranslation();

  const permissions = usePermissions(link.collection.id as number);

  const [editLinkModal, setEditLinkModal] = useState(false);
  const [deleteLinkModal, setDeleteLinkModal] = useState(false);
  const [preservedFormatsModal, setPreservedFormatsModal] = useState(false);

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

  return (
    <>
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
          {linkInfo !== undefined && toggleShowInfo ? (
            <li>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  (document?.activeElement as HTMLElement)?.blur();
                  toggleShowInfo();
                }}
                className="whitespace-nowrap"
              >
                {!linkInfo ? t("show_link_details") : t("hide_link_details")}
              </div>
            </li>
          ) : undefined}
          {permissions === true || permissions?.canUpdate ? (
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
          ) : undefined}
          {link.type === "url" && (
            <li>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  (document?.activeElement as HTMLElement)?.blur();
                  setPreservedFormatsModal(true);
                }}
                className="whitespace-nowrap"
              >
                {t("preserved_formats")}
              </div>
            </li>
          )}
          {permissions === true || permissions?.canDelete ? (
            <li>
              <div
                role="button"
                tabIndex={0}
                onClick={async (e) => {
                  (document?.activeElement as HTMLElement)?.blur();
                  e.shiftKey
                    ? async () => {
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
                      }
                    : setDeleteLinkModal(true);
                }}
                className="whitespace-nowrap"
              >
                {t("delete")}
              </div>
            </li>
          ) : undefined}
        </ul>
      </div>

      {editLinkModal ? (
        <EditLinkModal
          onClose={() => setEditLinkModal(false)}
          activeLink={link}
        />
      ) : undefined}
      {deleteLinkModal ? (
        <DeleteLinkModal
          onClose={() => setDeleteLinkModal(false)}
          activeLink={link}
        />
      ) : undefined}
      {preservedFormatsModal ? (
        <PreservedFormatsModal
          onClose={() => setPreservedFormatsModal(false)}
          link={link}
        />
      ) : undefined}
      {/* {expandedLink ? (
                <ExpandedLink onClose={() => setExpandedLink(false)} link={link} />
              ) : undefined} */}
    </>
  );
}
