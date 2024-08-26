import {
  ArchivedFormat,
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useEffect, useRef, useState } from "react";
import useLinkStore from "@/store/links";
import unescapeString from "@/lib/client/unescapeString";
import LinkActions from "@/components/LinkViews/LinkComponents/LinkActions";
import LinkDate from "@/components/LinkViews/LinkComponents/LinkDate";
import LinkCollection from "@/components/LinkViews/LinkComponents/LinkCollection";
import Image from "next/image";
import { previewAvailable } from "@/lib/shared/getArchiveValidity";
import Link from "next/link";
import LinkIcon from "./LinkIcon";
import useOnScreen from "@/hooks/useOnScreen";
import { generateLinkHref } from "@/lib/client/generateLinkHref";
import usePermissions from "@/hooks/usePermissions";
import toast from "react-hot-toast";
import LinkTypeBadge from "./LinkTypeBadge";
import { useTranslation } from "next-i18next";
import { useCollections } from "@/hooks/store/collections";
import { useUser } from "@/hooks/store/user";
import { useGetLink, useLinks } from "@/hooks/store/links";
import { useRouter } from "next/router";
import useLocalSettingsStore from "@/store/localSettings";
import clsx from "clsx";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  count: number;
  className?: string;
  flipDropdown?: boolean;
  editMode?: boolean;
};

export default function LinkCard({ link, flipDropdown, editMode }: Props) {
  const { t } = useTranslation();

  const { data: collections = [] } = useCollections();

  const { data: user = {} } = useUser();

  const { setSelectedLinks, selectedLinks } = useLinkStore();

  const {
    settings: { show },
  } = useLocalSettingsStore();

  const {
    data: { data: links = [] },
  } = useLinks();
  const getLink = useGetLink();

  useEffect(() => {
    if (!editMode) {
      setSelectedLinks([]);
    }
  }, [editMode]);

  const handleCheckboxClick = (
    link: LinkIncludingShortenedCollectionAndTags
  ) => {
    if (selectedLinks.includes(link)) {
      setSelectedLinks(selectedLinks.filter((e) => e !== link));
    } else {
      setSelectedLinks([...selectedLinks, link]);
    }
  };

  let shortendURL;

  try {
    if (link.url) {
      shortendURL = new URL(link.url).host.toLowerCase();
    }
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

  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);
  const permissions = usePermissions(collection?.id as number);

  const router = useRouter();

  let isPublic = router.pathname.startsWith("/public") ? true : undefined;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (
      isVisible &&
      !link.preview?.startsWith("archives") &&
      link.preview !== "unavailable"
    ) {
      interval = setInterval(async () => {
        getLink.mutateAsync({ id: link.id as number, isPublicRoute: isPublic });
      }, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isVisible, link.preview]);

  const selectedStyle = selectedLinks.some(
    (selectedLink) => selectedLink.id === link.id
  )
    ? "border-primary bg-base-300"
    : "border-neutral-content";

  const selectable =
    editMode &&
    (permissions === true || permissions?.canCreate || permissions?.canDelete);

  return (
    <div
      ref={ref}
      className={`${selectedStyle} border border-solid border-neutral-content bg-base-200 shadow-md hover:shadow-none duration-100 rounded-2xl relative`}
      onClick={() =>
        selectable
          ? handleCheckboxClick(link)
          : editMode
            ? toast.error(t("link_selection_error"))
            : undefined
      }
    >
      <div
        className="rounded-2xl cursor-pointer h-full flex flex-col justify-between"
        onClick={() =>
          !editMode && window.open(generateLinkHref(link, user), "_blank")
        }
      >
        {show.image && (
          <div>
            <div className="relative rounded-t-2xl h-40 overflow-hidden">
              {previewAvailable(link) ? (
                <Image
                  src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}&preview=true`}
                  width={1280}
                  height={720}
                  alt=""
                  className="rounded-t-2xl select-none object-cover z-10 h-40 w-full shadow opacity-80 scale-105"
                  style={show.icon ? { filter: "blur(1px)" } : undefined}
                  draggable="false"
                  onError={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.display = "none";
                  }}
                />
              ) : link.preview === "unavailable" ? (
                <div className="bg-gray-50 duration-100 h-40 bg-opacity-80"></div>
              ) : (
                <div className="duration-100 h-40 bg-opacity-80 skeleton rounded-none"></div>
              )}
              {show.icon && (
                <div className="absolute top-0 left-0 right-0 bottom-0 rounded-t-2xl flex items-center justify-center shadow rounded-md">
                  <LinkIcon link={link} />
                </div>
              )}
            </div>
            <hr className="divider my-0 border-t border-neutral-content h-[1px]" />
          </div>
        )}

        <div className="flex flex-col justify-between h-full min-h-24">
          <div className="p-3 flex flex-col gap-2">
            {show.name && (
              <p className="truncate w-full pr-9 text-primary text-sm">
                {unescapeString(link.name)}
              </p>
            )}

            {show.link && <LinkTypeBadge link={link} />}
          </div>

          {(show.collection || show.date) && (
            <div>
              <hr className="divider mt-2 mb-1 last:hidden border-t border-neutral-content h-[1px]" />

              <div className="flex justify-between text-xs text-neutral px-3 pb-1 gap-2">
                {show.collection && (
                  <div className="cursor-pointer truncate">
                    <LinkCollection link={link} collection={collection} />
                  </div>
                )}
                {show.date && <LinkDate link={link} />}
              </div>
            </div>
          )}
        </div>
      </div>

      <LinkActions
        link={link}
        collection={collection}
        position={clsx(show.image ? "top-[10.75rem]" : "top-3", "right-3")}
        flipDropdown={flipDropdown}
      />
    </div>
  );
}
