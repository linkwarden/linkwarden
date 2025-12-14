import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import useLocalSettingsStore from "@/store/localSettings";
import {
  ArchivedFormat,
  CollectionIncludingMembersAndLinkCount,
} from "@linkwarden/types";
import { useEffect, useRef, useState } from "react";
import unescapeString from "@/lib/client/unescapeString";
import LinkActions from "@/components/LinkViews/LinkComponents/LinkActions";
import LinkDate from "@/components/LinkViews/LinkComponents/LinkDate";
import LinkCollection from "@/components/LinkViews/LinkComponents/LinkCollection";
import Image from "next/image";
import {
  atLeastOneFormatAvailable,
  formatAvailable,
} from "@linkwarden/lib/formatStats";
import useOnScreen from "@/hooks/useOnScreen";
import { useCollections } from "@linkwarden/router/collections";
import { useUser } from "@linkwarden/router/user";
import { useGetLink, useLinks } from "@linkwarden/router/links";
import { useRouter } from "next/router";
import openLink from "@/lib/client/openLink";
import LinkIcon from "./LinkViews/LinkComponents/LinkIcon";
import LinkFormats from "./LinkViews/LinkComponents/LinkFormats";
import LinkTypeBadge from "./LinkViews/LinkComponents/LinkTypeBadge";
import LinkPin from "./LinkViews/LinkComponents/LinkPin";
import { Separator } from "./ui/separator";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@linkwarden/lib";
import { useTranslation } from "react-i18next";

export function DashboardLinks({
  links,
  isLoading,
  type,
}: {
  links?: LinkIncludingShortenedCollectionAndTags[];
  isLoading?: boolean;
  type?: "collection" | "recent";
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 min-w-60 w-60">
        <div className="skeleton h-40 w-full"></div>
        <div className="skeleton h-3 w-2/3"></div>
        <div className="skeleton h-3 w-full"></div>
        <div className="skeleton h-3 w-full"></div>
        <div className="skeleton h-3 w-1/3"></div>
      </div>
    );
  }
  return (
    <ul
      className={`flex gap-5 overflow-x-auto overflow-y-hidden hide-scrollbar w-full min-h-fit`}
    >
      {links?.map((e, i) => <Card key={i} link={e} dashboardType={type} />)}
    </ul>
  );
}

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  editMode?: boolean;
  dashboardType?: "collection" | "recent";
};

export function Card({ link, editMode, dashboardType }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${link.id}-${dashboardType}`,
    data: {
      linkId: link.id,
      dashboardType,
    },
  });
  const { data: collections = [] } = useCollections();
  const { t } = useTranslation();

  const { data: user } = useUser();

  const {
    settings: { show },
  } = useLocalSettingsStore();

  const { links } = useLinks();

  const router = useRouter();
  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  const { refetch } = useGetLink({ id: link.id as number, isPublicRoute });

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter key to open link
    if (e.key === "Enter") {
      !editMode && openLink(link, user, () => setLinkModal(true));
      return;
    }

    // Leave other key events to dnd-kit
    listeners?.onKeyDown(e);
  };

  return (
    <li
      ref={setNodeRef}
      className={cn(
        isDragging ? "opacity-30" : "opacity-100",
        "relative group touch-manipulation select-none"
      )}
    >
      <div
        ref={ref}
        className={`min-w-60 w-60 border border-solid border-neutral-content bg-base-200 duration-100 rounded-xl relative group h-full`}
      >
        <div
          className="rounded-xl cursor-pointer h-full w-full flex flex-col justify-between"
          onClick={() =>
            !editMode && openLink(link, user, () => setLinkModal(true))
          }
          aria-label={`${unescapeString(link.name)} - ${shortendURL}`}
          role="button"
          {...listeners}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {show.image && (
            <div>
              <div className={`relative rounded-t-xl h-40 overflow-hidden`}>
                {formatAvailable(link, "preview") ? (
                  <Image
                    src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}&preview=true&updatedAt=${link.updatedAt}`}
                    width={1280}
                    height={720}
                    alt=""
                    className={`rounded-t-xl select-none object-cover z-10 h-40 w-full shadow opacity-80 scale-105`}
                    style={show.icon ? { filter: "blur(1px)" } : undefined}
                    draggable="false"
                    onError={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.display = "none";
                    }}
                  />
                ) : link.preview === "unavailable" ? (
                  <div className={`bg-gray-50 h-40 bg-opacity-80`}></div>
                ) : (
                  <div
                    className={`h-40 bg-opacity-80 skeleton rounded-none`}
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
            <div className="p-3 flex flex-col justify-between h-full gap-2">
              {show.name && (
                <h4 className="line-clamp-2 w-full text-primary text-sm">
                  {unescapeString(link.name)}
                </h4>
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
        {!isPublicRoute && <LinkPin link={link} />}
        <LinkActions
          link={link}
          collection={collection}
          linkModal={linkModal}
          setLinkModal={(e) => setLinkModal(e)}
          className="absolute top-3 right-3 group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 duration-100 text-neutral z-20"
        />
      </div>
    </li>
  );
}
