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
        onClick={() => selectable && handleCheckboxClick(link)}
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
        {!editMode ? (
          <>
            <Link
              href={generateLinkHref(link, account)}
              target="_blank"
              className="flex items-center cursor-pointer"
            >
              <div className="shrink-0">
                <LinkIcon link={link} width="sm:w-12 w-8 mt-1 sm:mt-0" />
              </div>

              <div className="w-[calc(100%-56px)] ml-2">
                <p className="line-clamp-1 mr-8 text-primary">
                  {unescapeString(link.name || link.description) || link.url}
                </p>

                <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-neutral">
                  <div className="flex items-center gap-x-3 w-fit text-neutral flex-wrap">
                    {collection && (
                      <LinkCollection link={link} collection={collection} />
                    )}
                    {link.url ? (
                      <div className="flex items-center gap-1 w-fit text-neutral truncate">
                        <i className="bi-link-45deg text-lg" />
                        <p className="truncate w-full">{shortendURL}</p>
                      </div>
                    ) : (
                      <div className="badge badge-primary badge-sm my-1">
                        {link.type}
                      </div>
                    )}
                    <LinkDate link={link} />
                  </div>
                </div>
              </div>
            </Link>
            <LinkActions
              link={link}
              collection={collection}
              position="top-3 right-3"
              flipDropdown={flipDropdown}
              // toggleShowInfo={() => setShowInfo(!showInfo)}
              // linkInfo={showInfo}
            />
            {showInfo && (
              <div>
                <div className="pb-3 mt-1 px-3">
                  <p className="text-neutral text-lg font-semibold">
                    Description
                  </p>

                  <hr className="divider my-2 last:hidden border-t border-neutral-content h-[1px]" />
                  <p>
                    {link.description ? (
                      unescapeString(link.description)
                    ) : (
                      <span className="text-neutral text-sm">
                        No description provided.
                      </span>
                    )}
                  </p>
                  {link.tags[0] && (
                    <>
                      <p className="text-neutral text-lg mt-3 font-semibold">
                        Tags
                      </p>

                      <hr className="divider my-2 last:hidden border-t border-neutral-content h-[1px]" />

                      <div className="flex gap-3 items-center flex-wrap mt-2 truncate relative">
                        <div className="flex gap-1 items-center flex-wrap">
                          {link.tags.map((e, i) => (
                            <Link
                              href={"/tags/" + e.id}
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="btn btn-xs btn-ghost truncate max-w-[19rem]"
                            >
                              #{e.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center cursor-pointer">
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
                      <div className="flex items-center gap-1 w-fit text-neutral truncate">
                        <i className="bi-link-45deg text-lg" />
                        <p className="truncate w-full select-none">
                          {shortendURL}
                        </p>
                      </div>
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
          </>
        )}
      </div>
      <div className="divider my-0 last:hidden h-[1px]"></div>
    </>
  );
}
