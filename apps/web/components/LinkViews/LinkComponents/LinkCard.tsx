import {
  ArchivedFormat,
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
import React, { useRef, useState } from "react";
import unescapeString from "@/lib/client/unescapeString";
import LinkActions from "@/components/LinkViews/LinkComponents/LinkActions";
import LinkDate from "@/components/LinkViews/LinkComponents/LinkDate";
import LinkCollection from "@/components/LinkViews/LinkComponents/LinkCollection";
import Image from "next/image";
import {
  atLeastOneFormatAvailable,
  formatAvailable,
} from "@linkwarden/lib/formatStats";
import LinkIcon from "./LinkIcon";
import toast from "react-hot-toast";
import LinkTypeBadge from "./LinkTypeBadge";
import useLocalSettingsStore from "@/store/localSettings";
import LinkPin from "./LinkPin";
import LinkFormats from "./LinkFormats";
import openLink from "@/lib/client/openLink";
import { Separator } from "@/components/ui/separator";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { TFunction } from "i18next";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  collection: CollectionIncludingMembersAndLinkCount;
  isPublicRoute: boolean;
  t: TFunction<"translation", undefined>;
  user: any;
  disableDraggable: boolean;
  isSelected: boolean;
  toggleSelected: (id: number) => void;
  imageHeightClass: string;
  editMode?: boolean;
};

function LinkCard({
  link,
  collection,
  isPublicRoute,
  t,
  user,
  disableDraggable,
  isSelected,
  toggleSelected,
  imageHeightClass,
  editMode,
}: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: link.id?.toString() ?? "",
    data: {
      linkId: link.id,
    },
    disabled: disableDraggable,
  });

  const {
    settings: { show },
  } = useLocalSettingsStore();

  const ref = useRef<HTMLDivElement>(null);

  const [linkModal, setLinkModal] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border border-solid border-neutral-content bg-base-200 shadow-md hover:shadow-none duration-100 rounded-xl relative group",
        isSelected && "border-primary bg-base-300",
        isDragging ? "opacity-30" : "opacity-100",
        "relative group touch-manipulation select-none"
      )}
      onClick={() =>
        editMode
          ? toggleSelected(link.id as number)
          : editMode
            ? toast.error(t("link_selection_error"))
            : undefined
      }
    >
      <div ref={ref} className="h-full">
        <div
          className="rounded-xl cursor-pointer h-full flex flex-col justify-between"
          onClick={() =>
            !editMode && openLink(link, user, () => setLinkModal(true))
          }
          {...listeners}
          {...attributes}
        >
          {show.image && (
            <div>
              <div
                className={`relative rounded-t-xl ${imageHeightClass} overflow-hidden`}
              >
                {formatAvailable(link, "preview") ? (
                  <Image
                    src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}&preview=true&updatedAt=${link.updatedAt}`}
                    width={1280}
                    height={720}
                    alt=""
                    className={`rounded-t-xl select-none object-cover z-10 ${imageHeightClass} w-full shadow opacity-80 scale-105`}
                    style={show.icon ? { filter: "blur(1px)" } : undefined}
                    draggable="false"
                    onError={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.display = "none";
                    }}
                    unoptimized
                  />
                ) : link.preview === "unavailable" ? (
                  <div
                    className={`bg-gray-50 ${imageHeightClass} bg-opacity-80`}
                  ></div>
                ) : (
                  <div
                    className={`${imageHeightClass} bg-opacity-80 skeleton rounded-none`}
                  ></div>
                )}
                {show.icon && (
                  <div className="absolute top-0 left-0 right-0 bottom-0 rounded-t-xl flex items-center justify-center rounded-md">
                    <LinkIcon link={link} />
                  </div>
                )}
                {show.preserved_formats &&
                  link.type === "url" &&
                  atLeastOneFormatAvailable(link) && (
                    <div className="absolute bottom-0 right-0 m-2 bg-base-200 bg-opacity-60 px-1 rounded-md">
                      <LinkFormats link={link} />
                    </div>
                  )}
              </div>
              <Separator />
            </div>
          )}

          <div className="flex flex-col justify-between h-full min-h-11">
            <div className="p-3 flex flex-col gap-2">
              {show.name && (
                <p className="truncate w-full text-primary text-sm">
                  {unescapeString(link.name)}
                </p>
              )}

              {show.link && <LinkTypeBadge link={link} />}
            </div>

            {(show.collection || show.date) && (
              <div>
                <Separator className="mb-1" />

                <div className="flex justify-between items-center text-xs text-neutral px-3 pb-1 gap-2">
                  {show.collection && !isPublicRoute && collection && (
                    <div className="cursor-pointer truncate">
                      <LinkCollection
                        link={link}
                        collection={collection}
                        isPublicRoute={isPublicRoute}
                      />
                    </div>
                  )}
                  {show.date && <LinkDate link={link} />}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overlay on hover */}
        <div className="absolute pointer-events-none top-0 left-0 right-0 bottom-0 bg-base-100 bg-opacity-0 group-hover:bg-opacity-20 group-focus-within:opacity-20 rounded-xl duration-100"></div>
        <LinkActions
          link={link}
          linkModal={linkModal}
          t={t}
          setLinkModal={(e) => setLinkModal(e)}
          className="absolute top-3 right-3 group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 duration-100 text-neutral z-20"
        />
        {!isPublicRoute && <LinkPin link={link} />}
      </div>
    </div>
  );
}

export default React.memo(LinkCard);
