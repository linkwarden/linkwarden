import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import {
  faFolder,
  faEllipsis,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import Image from "next/image";
import Dropdown from "./Dropdown";
import useLinkStore from "@/store/links";
import useCollectionStore from "@/store/collections";
import useAccountStore from "@/store/account";
import useModalStore from "@/store/modals";
import { faCalendarDays } from "@fortawesome/free-regular-svg-icons";
import usePermissions from "@/hooks/usePermissions";
import { toast } from "react-hot-toast";
import isValidUrl from "@/lib/client/isValidUrl";
import Link from "next/link";
import unescapeString from "@/lib/client/unescapeString";
import { useRouter } from "next/router";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  count: number;
  className?: string;
};

type DropdownTrigger =
  | {
      x: number;
      y: number;
    }
  | false;

export default function LinkCard({ link, count, className }: Props) {
  const { setModal } = useModalStore();

  const router = useRouter();

  const permissions = usePermissions(link.collection.id as number);

  const [expandDropdown, setExpandDropdown] = useState<DropdownTrigger>(false);

  const { collections } = useCollectionStore();

  const { links } = useLinkStore();

  const { account } = useAccountStore();

  let shortendURL;

  try {
    shortendURL = new URL(link.url).host.toLowerCase();
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

  const { removeLink, updateLink, getLink } = useLinkStore();

  const pinLink = async () => {
    const isAlreadyPinned = link?.pinnedBy && link.pinnedBy[0];

    const load = toast.loading("Applying...");

    setExpandDropdown(false);

    const response = await updateLink({
      ...link,
      pinnedBy: isAlreadyPinned ? undefined : [{ id: account.id }],
    });

    toast.dismiss(load);

    response.ok &&
      toast.success(`Link ${isAlreadyPinned ? "Unpinned!" : "Pinned!"}`);
  };

  const updateArchive = async () => {
    const load = toast.loading("Sending request...");

    setExpandDropdown(false);

    const response = await fetch(`/api/v1/links/${link.id}/archive`, {
      method: "PUT",
    });

    const data = await response.json();

    toast.dismiss(load);

    if (response.ok) {
      toast.success(`Link is being archived...`);
      getLink(link.id as number);
    } else toast.error(data.response);
  };

  const deleteLink = async () => {
    const load = toast.loading("Deleting...");

    const response = await removeLink(link.id as number);

    toast.dismiss(load);

    response.ok && toast.success(`Link Deleted.`);
    setExpandDropdown(false);
  };

  const url = isValidUrl(link.url) ? new URL(link.url) : undefined;

  const formattedDate = new Date(link.createdAt as string).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <>
      <div
        className={`h-fit border border-solid border-neutral-content bg-gradient-to-tr from-slate-200 dark:from-neutral-800 from-10% to-gray-50 dark:to-[#303030] via-20% shadow hover:shadow-none duration-100 rounded-2xl relative group ${
          className || ""
        }`}
      >
        {(permissions === true ||
          permissions?.canUpdate ||
          permissions?.canDelete) && (
          <div
            onClick={(e) => {
              setExpandDropdown({ x: e.clientX, y: e.clientY });
            }}
            id={"expand-dropdown" + link.id}
            className="text-neutral-content dark:text-gray-300 inline-flex rounded-md cursor-pointer btn btn-ghost btn-sm btn-square dark:hover:bg-neutral-700 absolute right-4 top-4 z-10 duration-100"
          >
            <FontAwesomeIcon
              icon={faEllipsis}
              title="More"
              className="w-5 h-5"
              id={"expand-dropdown" + link.id}
            />
          </div>
        )}

        <div
          onClick={() => router.push("/links/" + link.id)}
          className="flex items-start cursor-pointer gap-5 sm:gap-10 h-full w-full p-4"
        >
          {url && account.displayLinkIcons && (
            <Image
              src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url.origin}&size=32`}
              width={64}
              height={64}
              alt=""
              className={`${
                account.blurredFavicons ? "blur-sm " : ""
              }absolute w-16 group-hover:opacity-80 duration-100 rounded-2xl bottom-5 right-5 opacity-60 select-none z-10`}
              draggable="false"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = "none";
              }}
            />
          )}

          <div className="flex justify-between gap-5 w-full h-full z-0">
            <div className="flex flex-col justify-between w-full">
              <div className="flex items-baseline gap-1">
                <p className="text-sm text-neutral">{count + 1}</p>
                <p className="text-lg truncate capitalize w-full pr-8">
                  {unescapeString(link.name || link.description)}
                </p>
              </div>
              <Link
                href={`/collections/${link.collection.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="flex items-center gap-1 max-w-full w-fit my-1 hover:opacity-70 duration-100"
              >
                <FontAwesomeIcon
                  icon={faFolder}
                  className="w-4 h-4 mt-1 drop-shadow"
                  style={{ color: collection?.color }}
                />
                <p className="truncate capitalize w-full">{collection?.name}</p>
              </Link>

              {/* {link.tags[0] ? (
                <div className="flex gap-3 items-center flex-wrap my-2 truncate relative">
                  <div className="flex gap-1 items-center flex-nowrap">
                    {link.tags.map((e, i) => (
                      <Link
                        href={"/tags/" + e.id}
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="px-2 bg-sky-200 dark:bg-sky-900 text-xs rounded-3xl cursor-pointer hover:opacity-60 duration-100 truncate max-w-[19rem]"
                      >
                        {e.name}
                      </Link>
                    ))}
                  </div>
                  <div className="absolute w-1/2 top-0 bottom-0 right-0 bg-gradient-to-r from-transparent to-slate-100 dark:to-neutral-800 to-35%"></div>
                </div>
              ) : undefined} */}

              <Link
                href={link.url}
                target="_blank"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="flex items-center gap-1 max-w-full w-fit text-neutral hover:opacity-70 duration-100"
              >
                <FontAwesomeIcon icon={faLink} className="mt-1 w-4 h-4" />
                <p className="truncate w-full">{shortendURL}</p>
              </Link>
              <div className="flex items-center gap-1 text-neutral">
                <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" />
                <p>{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {expandDropdown ? (
        <Dropdown
          points={{ x: expandDropdown.x, y: expandDropdown.y }}
          items={[
            permissions === true
              ? {
                  name:
                    link?.pinnedBy && link.pinnedBy[0]
                      ? "Unpin"
                      : "Pin to Dashboard",
                  onClick: pinLink,
                }
              : undefined,
            permissions === true || permissions?.canUpdate
              ? {
                  name: "Edit",
                  onClick: () => {
                    setModal({
                      modal: "LINK",
                      state: true,
                      method: "UPDATE",
                      active: link,
                    });
                    setExpandDropdown(false);
                  },
                }
              : undefined,
            permissions === true
              ? {
                  name: "Refresh Link",
                  onClick: updateArchive,
                }
              : undefined,
            permissions === true || permissions?.canDelete
              ? {
                  name: "Delete",
                  onClick: deleteLink,
                }
              : undefined,
          ]}
          onClickOutside={(e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.id !== "expand-dropdown" + link.id)
              setExpandDropdown(false);
          }}
          className="w-40"
        />
      ) : null}
    </>
  );
}
