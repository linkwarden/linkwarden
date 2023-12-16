import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useEffect, useState } from "react";
import useLinkStore from "@/store/links";
import useCollectionStore from "@/store/collections";
import Link from "next/link";
import unescapeString from "@/lib/client/unescapeString";
import LinkActions from "@/components/LinkViews/LinkComponents/LinkActions";
import LinkDate from "@/components/LinkViews/LinkComponents/LinkDate";
import LinkCollection from "@/components/LinkViews/LinkComponents/LinkCollection";
import LinkIcon from "@/components/LinkViews/LinkComponents/LinkIcon";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  count: number;
  className?: string;
};

export default function LinkCardCompact({ link, count, className }: Props) {
  const { collections } = useCollectionStore();

  const { links } = useLinkStore();

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

  return (
    <div
      className={`h-fit border border-solid border-neutral-content bg-base-200 shadow-md hover:shadow-none duration-100 rounded-2xl relative ${
        className || ""
      }`}
    >
      <div className={"rounded-2xl overflow-clip"}>
        <div className={"flex items-center"}>
          <div className="shrink-0">
              <LinkIcon link={link} />
          </div>

          <Link
            href={"/links/" + link.id}
            className="flex flex-col justify-between cursor-pointer h-full w-full gap-1 p-3"
          >
            <div className={"flex items-center gap-2"}>
              <div className="flex items-baseline gap-1">
                <p className="text-sm text-neutral">{count + 1}</p>
                <p className="text-lg truncate">
                  {unescapeString(link.name || link.description) || link.url}
                </p>
              </div>

              {link.url ? (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(link.url || "", "_blank");
                  }}
                  className="flex items-center gap-1 max-w-full w-fit text-xs text-neutral hover:opacity-60 duration-100"
                >
                  <p className="truncate w-full">{shortendURL}</p>
                </div>
              ) : (
                <div className="badge badge-primary badge-sm my-1">
                  {link.type}
                </div>
              )}
            </div>

            <div className={"flex items-center gap-2 text-xs"}>
              <LinkCollection link={link} collection={collection} />
              &middot;
              <LinkDate link={link} />
            </div>
          </Link>
        </div>
      </div>

      <LinkActions link={link} collection={collection} />
    </div>
  );
}
