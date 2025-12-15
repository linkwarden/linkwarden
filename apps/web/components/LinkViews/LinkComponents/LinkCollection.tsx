import Icon from "@/components/Icon";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
import { IconWeight } from "@phosphor-icons/react";
import Link from "next/link";
import React from "react";

function LinkCollection({
  link,
  collection,
  isPublicRoute,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  collection: CollectionIncludingMembersAndLinkCount;
  isPublicRoute: boolean;
}) {
  return !isPublicRoute && collection?.name ? (
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
            color={link.collection.color}
          />
        ) : (
          <i
            className="bi-folder-fill text-lg"
            style={{ color: link.collection.color }}
          ></i>
        )}
        <p className="truncate">{collection?.name}</p>
      </Link>
    </>
  ) : null;
}

export default React.memo(LinkCollection);
