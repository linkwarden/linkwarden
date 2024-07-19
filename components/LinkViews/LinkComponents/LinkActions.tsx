import { useState } from "react";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import usePermissions from "@/hooks/usePermissions";
import EditLinkModal from "@/components/ModalContent/EditLinkModal";
import DeleteLinkModal from "@/components/ModalContent/DeleteLinkModal";
import PreservedFormatsModal from "@/components/ModalContent/PreservedFormatsModal";
import useLinkStore from "@/store/links";
import { toast } from "react-hot-toast";
import useAccountStore from "@/store/account";
import { dropdownTriggerer } from "@/lib/client/utils";
import { useTranslation } from "next-i18next";

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

  const { account } = useAccountStore();

  const { removeLink, updateLink } = useLinkStore();

  const pinLink = async () => {
    const isAlreadyPinned = link?.pinnedBy && link.pinnedBy[0];

    const load = toast.loading(t("applying"));

    const response = await updateLink({
      ...link,
      pinnedBy: isAlreadyPinned ? undefined : [{ id: account.id }],
    });

    toast.dismiss(load);

    if (response.ok) {
      toast.success(isAlreadyPinned ? t("link_unpinned") : t("link_unpinned"));
    } else {
      toast.error(response.data as string);
    }
  };

  const deleteLink = async () => {
    const load = toast.loading(t("deleting"));

    const response = await removeLink(link.id as number);

    toast.dismiss(load);

    if (response.ok) {
      toast.success(t("deleted"));
    } else {
      toast.error(response.data as string);
    }
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
          className={`dropdown-content z-[20] menu shadow bg-base-200 border border-neutral-content rounded-box w-44 mr-1 ${
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
                onClick={(e) => {
                  (document?.activeElement as HTMLElement)?.blur();
                  e.shiftKey ? deleteLink() : setDeleteLinkModal(true);
                }}
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
          activeLink={link}
        />
      ) : undefined}
      {/* {expandedLink ? (
                <ExpandedLink onClose={() => setExpandedLink(false)} link={link} />
              ) : undefined} */}
    </>
  );
}
