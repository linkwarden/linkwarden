import Icon from "@/components/Icon";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { IconWeight } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

export default function LinkCollection({
  collection,
}: {
  collection: CollectionIncludingMembersAndLinkCount;
}) {
  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  return !isPublicRoute && collection?.name ? (
    <>
      <Link
        href={`/collections/${collection.id}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex items-center gap-1 max-w-full w-fit hover:opacity-70 duration-100 select-none"
        title={collection?.name}
      >
        {collection.icon ? (
          <Icon
            icon={collection.icon}
            size={20}
            weight={(collection.iconWeight || "regular") as IconWeight}
            color={collection.color}
          />
        ) : (
          <i
            className="bi-folder-fill text-lg"
            style={{ color: collection.color }}
          ></i>
        )}
        <p className="truncate capitalize">{collection?.name}</p>
      </Link>
    </>
  ) : null;
}
