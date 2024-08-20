import Icon from "@/components/Icon";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { IconWeight } from "@phosphor-icons/react";
import Link from "next/link";
import React from "react";

export default function LinkCollection({
  link,
  collection,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  collection: CollectionIncludingMembersAndLinkCount;
}) {
  return (
    <>
      <Link
        href={`/collections/${link.collection.id}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex items-center gap-1 max-w-full w-fit hover:opacity-70 duration-100 select-none"
        title={collection?.name}
      >
        {link.collection.icon ? (
          <Icon
            icon={link.collection.icon}
            size={20}
            weight={(link.collection.iconWeight || "regular") as IconWeight}
            color={link.collection.color || "#0ea5e9"}
          />
        ) : (
          <i
            className="bi-folder-fill text-lg"
            style={{ color: link.collection.color || "#0ea5e9" }}
          ></i>
        )}
        <p className="truncate capitalize">{collection?.name}</p>
      </Link>
    </>
  );
}
