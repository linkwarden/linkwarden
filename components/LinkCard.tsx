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
import useLinkStore from "@/store/links";
import useCollectionStore from "@/store/collections";
import useAccountStore from "@/store/account";
import {
  faCalendarDays,
  faFileImage,
  faFilePdf,
} from "@fortawesome/free-regular-svg-icons";
import usePermissions from "@/hooks/usePermissions";
import { toast } from "react-hot-toast";
import isValidUrl from "@/lib/shared/isValidUrl";
import Link from "next/link";
import unescapeString from "@/lib/client/unescapeString";
import { useRouter } from "next/router";
import EditLinkModal from "./ModalContent/EditLinkModal";
import DeleteLinkModal from "./ModalContent/DeleteLinkModal";
import ExpandedLink from "./ModalContent/ExpandedLink";
import PreservedFormatsModal from "./ModalContent/PreservedFormatsModal";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  count: number;
  className?: string;
};

export default function LinkCard({ link, count, className }: Props) {
  const router = useRouter();

  const permissions = usePermissions(link.collection.id as number);

  const { collections } = useCollectionStore();

  const { links } = useLinkStore();

  const { account } = useAccountStore();

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

  const { removeLink, updateLink, getLink } = useLinkStore();

  const pinLink = async () => {
    const isAlreadyPinned = link?.pinnedBy && link.pinnedBy[0];

    const load = toast.loading("Applying...");

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
  };

  const url =
    isValidUrl(link.url || "") && link.url ? new URL(link.url) : undefined;

  const formattedDate = new Date(link.createdAt as string).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const [editLinkModal, setEditLinkModal] = useState(false);
  const [deleteLinkModal, setDeleteLinkModal] = useState(false);
  const [preservedFormatsModal, setPreservedFormatsModal] = useState(false);
  const [expandedLink, setExpandedLink] = useState(false);

  return (
    <div
      className={`h-fit border border-solid border-neutral-content bg-base-200 shadow-md hover:shadow-none duration-100 rounded-2xl relative ${
        className || ""
      }`}
    >
      {permissions === true ||
      permissions?.canUpdate ||
      permissions?.canDelete ? (
        <div className="dropdown dropdown-left absolute top-3 right-3 z-20">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-sm btn-square text-neutral"
          >
            <FontAwesomeIcon
              icon={faEllipsis}
              title="More"
              className="w-5 h-5"
              id={"expand-dropdown" + collection.id}
            />
          </div>
          <ul className="dropdown-content z-[20] menu shadow bg-base-200 border border-neutral-content rounded-box w-44 mr-1">
            {permissions === true ? (
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
                    ? "Unpin"
                    : "Pin to Dashboard"}
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
                  Edit
                </div>
              </li>
            ) : undefined}
            {permissions === true ? (
              <li>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    (document?.activeElement as HTMLElement)?.blur();
                    setPreservedFormatsModal(true);
                    // updateArchive();
                  }}
                >
                  Preserved Formats
                </div>
              </li>
            ) : undefined}
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
                  Delete
                </div>
              </li>
            ) : undefined}
          </ul>
        </div>
      ) : undefined}

      <Link
        href={"/links/" + link.id}
        // onClick={
        //   () => router.push("/links/" + link.id)
        //   // setExpandedLink(true)
        // }
        className="flex flex-col justify-between cursor-pointer h-full w-full gap-1 p-3"
      >
        {link.url && url ? (
          <Image
            src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url.origin}&size=32`}
            width={64}
            height={64}
            alt=""
            className={`absolute w-12 bg-white shadow rounded-md p-1 bottom-3 right-3 select-none z-10`}
            draggable="false"
            onError={(e) => {
              const target = e.target as HTMLElement;
              target.style.display = "none";
            }}
          />
        ) : link.type === "pdf" ? (
          <FontAwesomeIcon
            icon={faFilePdf}
            className="absolute h-12 w-12 bg-primary/20 text-primary shadow rounded-md p-2 bottom-3 right-3 select-none z-10"
          />
        ) : link.type === "image" ? (
          <FontAwesomeIcon
            icon={faFileImage}
            className="absolute h-12 w-12 bg-primary/20 text-primary shadow rounded-md p-2 bottom-3 right-3 select-none z-10"
          />
        ) : undefined}

        <div className="flex items-baseline gap-1">
          <p className="text-sm text-neutral">{count + 1}</p>
          <p className="text-lg truncate w-full pr-8">
            {unescapeString(link.name || link.description) || shortendURL}
          </p>
        </div>

        {link.url ? (
          <Link
            href={link.url || ""}
            target="_blank"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex items-center gap-1 max-w-full w-fit text-neutral hover:opacity-60 duration-100"
          >
            <FontAwesomeIcon icon={faLink} className="mt-1 w-4 h-4" />
            <p className="truncate w-full">{shortendURL}</p>
          </Link>
        ) : (
          <div className="badge badge-primary badge-sm my-1">{link.type}</div>
        )}

        <Link
          href={`/collections/${link.collection.id}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="flex items-center gap-1 max-w-full w-fit hover:opacity-70 duration-100"
        >
          <FontAwesomeIcon
            icon={faFolder}
            className="w-4 h-4 mt-1 drop-shadow"
            style={{ color: collection?.color }}
          />
          <p className="truncate capitalize w-full">{collection?.name}</p>
        </Link>

        <div className="flex items-center gap-1 text-neutral">
          <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" />
          <p>{formattedDate}</p>
        </div>
        {/* {link.tags[0] ? (
              <div className="flex gap-3 items-center flex-wrap mt-2 truncate relative">
                <div className="flex gap-1 items-center flex-nowrap">
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
                <div className="absolute w-1/2 top-0 bottom-0 right-0 bg-gradient-to-r from-transparent to-base-200 to-35%"></div>
              </div>
            ) : (
              <p className="text-xs mt-2 p-1 font-semibold italic">No Tags</p>
            )} */}
      </Link>
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
    </div>
  );
}
