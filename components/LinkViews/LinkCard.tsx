import {
  ArchivedFormat,
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useEffect, useRef, useState } from "react";
import useLinkStore from "@/store/links";
import useCollectionStore from "@/store/collections";
import unescapeString from "@/lib/client/unescapeString";
import LinkActions from "@/components/LinkViews/LinkComponents/LinkActions";
import LinkDate from "@/components/LinkViews/LinkComponents/LinkDate";
import LinkCollection from "@/components/LinkViews/LinkComponents/LinkCollection";
import Image from "next/image";
import { previewAvailable } from "@/lib/shared/getArchiveValidity";
import Link from "next/link";
import LinkIcon from "./LinkComponents/LinkIcon";
import LinkGroupedIconURL from "./LinkComponents/LinkGroupedIconURL";
import useOnScreen from "@/hooks/useOnScreen";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  count: number;
  className?: string;
};

export default function LinkGrid({ link, count, className }: Props) {
  const { collections } = useCollectionStore();

  const { links, getLink } = useLinkStore();

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

  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);

  useEffect(() => {
    let interval: any;

    if (
      isVisible &&
      !link.preview?.startsWith("archives") &&
      link.preview !== "unavailable"
    ) {
      getLink(link.id as number);

      interval = setInterval(async () => {
        getLink(link.id as number);
      }, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isVisible, link.preview]);

  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      ref={ref}
      className="border border-solid border-neutral-content bg-base-200 shadow-md hover:shadow-none duration-100 rounded-2xl relative"
    >
      <div className="relative rounded-t-2xl h-40 overflow-hidden">
        {previewAvailable(link) ? (
          <Image
            src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}&preview=true`}
            width={1280}
            height={720}
            alt=""
            className="rounded-t-2xl select-none object-cover z-10 h-40 w-full shadow opacity-80 scale-105"
            style={{ filter: "blur(2px)" }}
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
        <div
          style={
            {
              // background:
              //   "radial-gradient(circle, rgba(255, 255, 255, 0.5), transparent)",
            }
          }
          className="absolute top-0 left-0 right-0 bottom-0 rounded-t-2xl flex items-center justify-center shadow rounded-md"
        >
          <LinkIcon link={link} />
        </div>
      </div>

      <hr className="divider my-0 last:hidden border-t border-neutral-content h-[1px]" />

      <div className="p-3 mt-1">
        <p className="truncate w-full pr-8 text-primary">
          {unescapeString(link.name || link.description) || link.url}
        </p>

        <Link
          href={link.url || ""}
          target="_blank"
          title={link.url || ""}
          className="w-fit"
        >
          <div className="flex gap-1 item-center select-none text-neutral mt-1 hover:opacity-60 duration-100">
            <i className="bi-link-45deg text-lg mt-[0.15rem] leading-none"></i>
            <p className="text-sm truncate">{shortendURL}</p>
          </div>
        </Link>
      </div>

      <hr className="divider mt-2 mb-1 last:hidden border-t border-neutral-content h-[1px]" />
      <div className="flex justify-between text-xs text-neutral px-3 pb-1">
        <div className="cursor-pointer w-fit">
          {collection ? (
            <LinkCollection link={link} collection={collection} />
          ) : undefined}
        </div>
        <LinkDate link={link} />
      </div>

      {showInfo ? (
        <div className="p-3 absolute z-30 top-0 left-0 right-0 bottom-0 bg-base-200 rounded-2xl fade-in overflow-y-auto">
          <div
            onClick={() => setShowInfo(!showInfo)}
            className=" float-right btn btn-sm outline-none btn-circle btn-ghost z-10"
          >
            <i className="bi-x text-neutral text-2xl"></i>
          </div>
          <p className="text-neutral text-lg font-semibold">Description</p>

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
          {link.tags[0] ? (
            <>
              <p className="text-neutral text-lg mt-3 font-semibold">Tags</p>

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
          ) : undefined}
        </div>
      ) : undefined}

      <LinkActions
        link={link}
        collection={collection}
        position="top-[10.75rem] right-3"
        toggleShowInfo={() => setShowInfo(!showInfo)}
        linkInfo={showInfo}
      />
    </div>
  );
}
