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
import Link from "next/link";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  count: number;
  className?: string;
};

export default function LinkGrid({ link }: Props) {
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

  return (
    <div className="border border-solid border-neutral-content bg-base-200 shadow-md hover:shadow-none duration-100 rounded-2xl relative p-3">
      <div
        onClick={() => link.url && window.open(link.url || "", "_blank")}
        className="cursor-pointer"
      >
        <LinkIcon link={link} width="w-12 mb-3" />
        <p className="truncate w-full">
          {unescapeString(link.name || link.description) || link.url}
        </p>

        <div className="mt-1 flex flex-col text-xs text-neutral">
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
                <p className="truncate">{shortendURL}</p>
              </div>
            ) : (
              <div className="badge badge-primary badge-sm my-1">
                {link.type}
              </div>
            )}
          </div>
          <LinkDate link={link} />
        </div>
        <p className="truncate">{unescapeString(link.description)}</p>
        {link.tags[0] ? (
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
        ) : undefined}
      </div>

      <LinkActions
        toggleShowInfo={() => {}}
        linkInfo={false}
        link={link}
        collection={collection}
      />
    </div>
  );
}
