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
import Link from "next/link";
import { isPWA } from "@/lib/client/utils";
import { generateLinkHref } from "@/lib/client/generateLinkHref";
import useAccountStore from "@/store/account";
import usePermissions from "@/hooks/usePermissions";
import toast from "react-hot-toast";

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

  let shortendURL;

  try {
    shortendURL = new URL(link.url || "").host.toLowerCase();
  } catch (error) {
    console.log(error);
  }

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
        } duration-200 rounded-lg`}
        onClick={() =>
          selectable
            ? handleCheckboxClick(link)
            : editMode
              ? toast.error(
                  "You don't have permission to edit or delete this item."
                )
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
          className="flex items-center cursor-pointer"
          onClick={() =>
            !editMode && window.open(generateLinkHref(link, account), "_blank")
          }
        >
          <div className="shrink-0">
            <LinkIcon link={link} width="sm:w-12 w-8 mt-1 sm:mt-0" />
          </div>

          <div className="w-[calc(100%-56px)] ml-2">
            <p className="line-clamp-1 mr-8 text-primary select-none">
              {unescapeString(link.name || link.description) || link.url}
            </p>

            <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-neutral">
              <div className="flex items-center gap-x-3 w-fit text-neutral flex-wrap">
                {collection ? (
                  <LinkCollection link={link} collection={collection} />
                ) : undefined}
                {link.url ? (
                  <Link
                    href={link.url || ""}
                    target="_blank"
                    title={link.url || ""}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="flex gap-1 item-center select-none text-neutral mt-1 hover:opacity-70 duration-100"
                  >
                    <i className="bi-link-45deg text-lg mt-[0.1rem] leading-none"></i>
                    <p className="text-sm truncate">{shortendURL}</p>
                  </Link>
                ) : (
                  <div className="badge badge-primary badge-sm my-1 select-none">
                    {link.type}
                  </div>
                )}
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
      <div className="divider my-0 last:hidden h-[1px]"></div>
    </>
  );
}
