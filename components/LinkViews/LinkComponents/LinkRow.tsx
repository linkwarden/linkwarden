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
    <div className="border-b last:border-b-0 border-neutral-content relative">
      <div
        onClick={() => link.url && window.open(link.url || "", "_blank")}
        className="flex items-center cursor-pointer p-3"
      >
        <div className="shrink-0">
          <LinkIcon link={link} />
        </div>

        <div className="w-[calc(100%-56px)] ml-2">
          <p className="line-clamp-1 mr-8">
            {unescapeString(link.name || link.description) || link.url}
          </p>

          <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-neutral">
            <div className="flex items-center gap-2">
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
            </div>
            <span className="hidden sm:block">&middot;</span>
            <LinkDate link={link} />
          </div>
        </div>
      </div>

      <LinkActions link={link} collection={collection} />
    </div>
  );
}
