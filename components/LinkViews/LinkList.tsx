import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useEffect, useState } from "react";
import useLinkStore from "@/store/links";
import useCollectionStore from "@/store/collections";
import unescapeString from "@/lib/client/unescapeString";
import LinkActions from "@/components/LinkViews/LinkComponents/LinkActions";
import LinkDate from "@/components/LinkViews/LinkComponents/LinkDate";
import LinkCollection from "@/components/LinkViews/LinkComponents/LinkCollection";
import LinkIcon from "@/components/LinkViews/LinkComponents/LinkIcon";
import { isPWA } from "@/lib/client/utils";
import { generateLinkHref } from "@/lib/client/generateLinkHref";
import useAccountStore from "@/store/account";
import usePermissions from "@/hooks/usePermissions";
import toast from "react-hot-toast";
import LinkTypeBadge from "./LinkComponents/LinkTypeBadge";
import { useTranslation } from "next-i18next";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  count: number;
  className?: string;
  flipDropdown?: boolean;
  editMode?: boolean;
};

export default function LinkCardCompact({
  link,
  flipDropdown,
  editMode,
}: Props) {
  const { t } = useTranslation();

  const { collections } = useCollectionStore();
  const { account } = useAccountStore();
  const { links, setSelectedLinks, selectedLinks } = useLinkStore();

  useEffect(() => {
    if (!editMode) {
      setSelectedLinks([]);
    }
  }, [editMode]);

  const handleCheckboxClick = (
    link: LinkIncludingShortenedCollectionAndTags
  ) => {
    const linkIndex = selectedLinks.findIndex(
      (selectedLink) => selectedLink.id === link.id
    );

    if (linkIndex !== -1) {
      const updatedLinks = [...selectedLinks];
      updatedLinks.splice(linkIndex, 1);
      setSelectedLinks(updatedLinks);
    } else {
      setSelectedLinks([...selectedLinks, link]);
    }
  };

  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(
      collections.find(
        (e) => e.id === link.collection.id
      ) as CollectionIncludingMembersAndLinkCount
    );

  useEffect(() => {
    setCollection(
      collections.find(
        (e) => e.id === link.collection.id
      ) as CollectionIncludingMembersAndLinkCount
    );
  }, [collections, links]);

  const permissions = usePermissions(collection?.id as number);

  const [showInfo, setShowInfo] = useState(false);

  const selectedStyle = selectedLinks.some(
    (selectedLink) => selectedLink.id === link.id
  )
    ? "border border-primary bg-base-300"
    : "border-transparent";

  const selectable =
    editMode &&
    (permissions === true || permissions?.canCreate || permissions?.canDelete);

  return (
    <>
      <div
        className={`${selectedStyle} border relative items-center flex ${
          !showInfo && !isPWA() ? "hover:bg-base-300 p-3" : "py-3"
        } duration-200 rounded-lg w-full`}
        onClick={() =>
          selectable
            ? handleCheckboxClick(link)
            : editMode
              ? toast.error(t("link_selection_error"))
              : undefined
        }
      >
        {/* {showCheckbox &&
          editMode &&
          (permissions === true ||
            permissions?.canCreate ||
            permissions?.canDelete) && (
            <input
              type="checkbox"
              className="checkbox checkbox-primary my-auto mr-2"
              checked={selectedLinks.some(
                (selectedLink) => selectedLink.id === link.id
              )}
              onChange={() => handleCheckboxClick(link)}
            />
          )} */}
        <div
          className="flex items-center cursor-pointer w-full"
          onClick={() =>
            !editMode && window.open(generateLinkHref(link, account), "_blank")
          }
        >
          <div className="shrink-0">
            <LinkIcon link={link} className="w-12 h-12 text-4xl" />
          </div>

          <div className="w-[calc(100%-56px)] ml-2">
            <p className="line-clamp-1 mr-8 text-primary select-none">
              {link.name ? (
                unescapeString(link.name)
              ) : (
                <div className="mt-2">
                  <LinkTypeBadge link={link} />
                </div>
              )}
            </p>

            <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-neutral">
              <div className="flex items-center gap-x-3 text-neutral flex-wrap">
                {collection ? (
                  <LinkCollection link={link} collection={collection} />
                ) : undefined}
                {link.name && <LinkTypeBadge link={link} />}
                <LinkDate link={link} />
              </div>
            </div>
          </div>
        </div>
        <LinkActions
          link={link}
          collection={collection}
          position="top-3 right-3"
          flipDropdown={flipDropdown}
          // toggleShowInfo={() => setShowInfo(!showInfo)}
          // linkInfo={showInfo}
        />
      </div>
      <div
        className="last:hidden rounded-none"
        style={{
          borderTop: "1px solid var(--fallback-bc,oklch(var(--bc)/0.1))",
        }}
      ></div>
    </>
  );
}
