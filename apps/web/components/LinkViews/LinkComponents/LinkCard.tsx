import {
  ArchivedFormat,
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
import { useEffect, useMemo, useRef, useState } from "react";
import useLinkStore from "@/store/links";
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
import useOnScreen from "@/hooks/useOnScreen";
import usePermissions from "@/hooks/usePermissions";
import toast from "react-hot-toast";
import LinkTypeBadge from "./LinkTypeBadge";
import { useTranslation } from "next-i18next";
import { useCollections } from "@linkwarden/router/collections";
import { useUser } from "@linkwarden/router/user";
import { useGetLink, useLinks } from "@linkwarden/router/links";
import { useRouter } from "next/router";
import useLocalSettingsStore from "@/store/localSettings";
import LinkPin from "./LinkPin";
import LinkFormats from "./LinkFormats";
import openLink from "@/lib/client/openLink";
import { Separator } from "@/components/ui/separator";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import useMediaQuery from "@/hooks/useMediaQuery";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  columns: number;
  className?: string;
  editMode?: boolean;
};

export default function LinkCard({ link, columns, editMode }: Props) {
  const { t } = useTranslation();

  // we don't want to use the draggable feature for screen under 1023px since the sidebar is hidden
  const isSmallScreen = useMediaQuery("(max-width: 1023px)");
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: link.id?.toString() ?? "",
    data: {
      linkId: link.id,
    },
    disabled: isSmallScreen,
  });

  const heightMap = {
    1: "h-44",
    2: "h-40",
    3: "h-36",
    4: "h-32",
    5: "h-28",
    6: "h-24",
    7: "h-20",
    8: "h-20",
  };

  const imageHeightClass = useMemo(
    () => (columns ? heightMap[columns as keyof typeof heightMap] : "h-40"),
    [columns]
  );

  const { data: collections = [] } = useCollections();

  const { data: user } = useUser();

  const { setSelectedLinks, selectedLinks } = useLinkStore();

  const {
    settings: { show },
  } = useLocalSettingsStore();

  const { links } = useLinks();

  const router = useRouter();
  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  const { refetch } = useGetLink({ id: link.id as number, isPublicRoute });

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

  const [linkModal, setLinkModal] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (
      isVisible &&
      !link.preview?.startsWith("archives") &&
      link.preview !== "unavailable"
    ) {
      interval = setInterval(async () => {
        refetch().catch((error) => {
          console.error("Error refetching link:", error);
        });
      }, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isVisible, link.preview]);

  const isLinkSelected = selectedLinks.some(
    (selectedLink) => selectedLink.id === link.id
  );

  const selectable =
    editMode &&
    (permissions === true || permissions?.canCreate || permissions?.canDelete);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border border-solid border-neutral-content bg-base-200 shadow-md hover:shadow-none duration-100 rounded-xl relative group",
        isLinkSelected && "border-primary bg-base-300",
        isDragging ? "opacity-30" : "opacity-100",
        "relative group touch-manipulation select-none"
      )}
      onClick={() =>
        selectable
          ? handleCheckboxClick(link)
          : editMode
            ? toast.error(t("link_selection_error"))
            : undefined
      }
    >
      <div ref={ref}>
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

          <div className="flex flex-col justify-between h-full min-h-24">
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
                  {show.collection && !isPublicRoute && (
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

        {/* Overlay on hover */}
        <div className="absolute pointer-events-none top-0 left-0 right-0 bottom-0 bg-base-100 bg-opacity-0 group-hover:bg-opacity-20 group-focus-within:opacity-20 rounded-xl duration-100"></div>
        <LinkActions
          link={link}
          collection={collection}
          linkModal={linkModal}
          setLinkModal={(e) => setLinkModal(e)}
          className="absolute top-3 right-3 group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 duration-100 text-neutral z-20"
        />
        {!isPublicRoute && <LinkPin link={link} />}
      </div>
    </div>
  );
}
