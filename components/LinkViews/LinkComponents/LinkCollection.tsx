import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useRouter } from "next/router";
import React from "react";

export default function LinkCollection({ link, collection }: {
  link: LinkIncludingShortenedCollectionAndTags;
  collection: CollectionIncludingMembersAndLinkCount;
}) {
  const router = useRouter();

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/collections/${link.collection.id}`);
      }}
      className="flex items-center gap-1 max-w-full w-fit hover:opacity-70 duration-100"
    >
      <i className="bi-folder2 text-lg shadow" style={{ color: collection?.color }}></i>
      <p className="truncate capitalize">{collection?.name}</p>
    </div>
  );
}
