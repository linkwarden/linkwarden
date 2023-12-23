import {
  ArchivedFormat,
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
import Image from "next/image";
import { previewAvailable } from "@/lib/shared/getArchiveValidity";
import Link from "next/link";
import LinkIcon from "./LinkComponents/LinkIcon";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  count: number;
  className?: string;
};

export default function LinkGrid({ link, count, className }: Props) {
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
    <div className="border border-solid border-neutral-content bg-base-200 shadow-md hover:shadow-none duration-100 rounded-2xl relative">
      <div className="relative rounded-t-2xl h-52">
        {previewAvailable(link) ? (
          <Image
            src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}&preview=true`}
            width={1280}
            height={720}
            alt=""
            className="rounded-t-2xl select-none object-cover z-10 h-52 w-full shadow"
            draggable="false"
            onError={(e) => {
              const target = e.target as HTMLElement;
              target.style.display = "none";
            }}
          />
        ) : undefined}
        <div
          style={{
            background: "radial-gradient(circle, #ffffff, transparent)",
          }}
          className="absolute top-0 left-0 right-0 rounded-t-2xl flex items-center justify-center h-52 shadow rounded-md"
        >
          <LinkIcon link={link} width="w-12" />
        </div>
      </div>

      <div className="p-3">
        <p className="truncate w-full">
          {unescapeString(link.name || link.description) || link.url}
        </p>
        <div className="mt-1 flex flex-col text-xs text-neutral">
          <div className="flex items-center gap-2">
            <LinkCollection link={link} collection={collection} />
            &middot;
            {link.url ? (
              <Link
                href={link.url}
                target="_blank"
                className="flex items-center hover:opacity-60 cursor-pointer duration-100"
              >
                <p className="truncate">{shortendURL}</p>
              </Link>
            ) : (
              <div className="badge badge-primary badge-sm my-1">
                {link.type}
              </div>
            )}
          </div>
          <LinkDate link={link} />
        </div>
        {/* <p className="truncate">{unescapeString(link.description)}</p>
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
        ) : undefined} */}
      </div>

      <LinkActions link={link} collection={collection} />
    </div>
  );
}
