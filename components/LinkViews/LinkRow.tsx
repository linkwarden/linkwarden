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
import EditLinkModal from "../ModalContent/EditLinkModal";
import DeleteLinkModal from "../ModalContent/DeleteLinkModal";
import ExpandedLink from "../ModalContent/ExpandedLink";
import PreservedFormatsModal from "../ModalContent/PreservedFormatsModal";
import LinkActions from "@/components/LinkViews/LinkComponents/LinkActions";
import LinkDate from "@/components/LinkViews/LinkComponents/LinkDate";
import LinkCollection from "@/components/LinkViews/LinkComponents/LinkCollection";
import LinkIcon from "@/components/LinkViews/LinkComponents/LinkIcon";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  count: number;
  className?: string;
};

export default function LinkRow({ link, count, className }: Props) {
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
        (e) => e.id === link.collection.id,
      ) as CollectionIncludingMembersAndLinkCount,
    );

  useEffect(() => {
    setCollection(
      collections.find(
        (e) => e.id === link.collection.id,
      ) as CollectionIncludingMembersAndLinkCount,
    );
  }, [collections, links]);

  const { removeLink, updateLink } = useLinkStore();

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
    },
  );

  const iconClasses: string =
    "w-20 bg-white shadow p-1 bottom-3 right-3 select-none z-10";

  return (
    <div
      className={`h-fit border-b last:border-b-0 border-neutral-content duration-100 relative group ${
        className || ""
      }`}
    >
      <div className={"overflow-clip"}>
        <div className={"flex items-center"}>
          <Link
            href={"/links/" + link.id}
            className="group-first:rounded-tl-md group-last:rounded-bl-md overflow-clip"
          >
            <LinkIcon link={link} />
          </Link>

          <div className="p-3">
            <Link
              href={"/links/" + link.id}
              className="inline-flex cursor-pointer mb-1"
            >
              <p className="text-lg truncate">
                {unescapeString(link.name || link.description) || link.url}
              </p>
            </Link>

            <div className="flex items-center gap-2 text-xs text-neutral">
              <LinkCollection link={link} collection={collection} />
              &middot;
              {link.url ? (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(link.url || "", "_blank");
                  }}
                  className="flex items-center hover:opacity-60 cursor-pointer duration-100"
                >
                  <p className="truncate w-full">{shortendURL}</p>
                </div>
              ) : (
                <div className="badge badge-primary badge-sm my-1">
                  {link.type}
                </div>
              )}
              &middot;
              <LinkDate link={link} />
            </div>
          </div>
        </div>
      </div>

      <LinkActions link={link} collection={collection} />
    </div>
  );
}
