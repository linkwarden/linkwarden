import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

export default function LinkCollection({
  link,
  collection,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  collection: CollectionIncludingMembersAndLinkCount;
}) {
  const router = useRouter();

  return (
    <Link
      href={`/collections/${link.collection.id}`}
      onClick={(e) => {
        e.stopPropagation();
      }}
      className="flex items-center gap-1 max-w-full w-fit hover:opacity-70 duration-100 select-none"
      title={collection?.name}
    >
      <i
        className="bi-folder-fill text-lg drop-shadow"
        style={{ color: collection?.color }}
      ></i>
      <p className="truncate capitalize">{collection?.name}</p>
    </Link>
  );
}
