import useCollectionStore from "@/store/collections";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

type Props = {
  links: boolean;
};

const CollectionSelection = ({ links }: Props) => {
  const { collections } = useCollectionStore();
  const [active, setActive] = useState("");
  const router = useRouter();

  useEffect(() => {
    setActive(router.asPath);
  }, [router, collections]);

  return (
    <div>
      {collections[0] ? (
        collections
          .sort((a, b) => a.name.localeCompare(b.name))
          .filter((e) => e.parentId === null)
          .map((e, i) => (
            <CollectionItem
              key={i}
              collection={e}
              active={active}
              collections={collections}
            />
          ))
      ) : (
        <div
          className={`duration-100 py-1 px-2 flex items-center gap-2 w-full rounded-md h-8 capitalize`}
        >
          <p className="text-neutral text-xs font-semibold truncate w-full pr-7">
            You Have No Collections...
          </p>
        </div>
      )}
    </div>
  );
};

export default CollectionSelection;

const CollectionItem = ({
  collection,
  active,
  collections,
}: {
  collection: CollectionIncludingMembersAndLinkCount;
  active: string;
  collections: CollectionIncludingMembersAndLinkCount[];
}) => {
  const hasChildren =
    collection.subCollections && collection.subCollections.length > 0;

  const router = useRouter();

  // Check if the current collection or any of its subcollections is active
  const isActiveOrParentOfActive = React.useMemo(() => {
    const isActive = active === `/collections/${collection.id}`;
    if (isActive) return true;

    const checkIfParentOfActive = (parentId: number): boolean => {
      return collections.some((e) => {
        if (e.id === parseInt(active.split("/collections/")[1])) {
          if (e.parentId === parentId) return true;
          if (e.parentId) return checkIfParentOfActive(e.parentId);
        }
        return false;
      });
    };

    return checkIfParentOfActive(collection.id as number);
  }, [active, collection.id, collections]);

  const [isOpen, setIsOpen] = useState(isActiveOrParentOfActive);

  useEffect(() => {
    setIsOpen(isActiveOrParentOfActive);
  }, [isActiveOrParentOfActive]);

  return hasChildren ? (
    <details open={isOpen}>
      <summary
        className={`${
          active === `/collections/${collection.id}`
            ? "bg-primary/20"
            : "hover:bg-neutral/20"
        } duration-100 rounded-md flex w-full items-center cursor-pointer mb-1 px-2`}
      >
        <Link href={`/collections/${collection.id}`} className="w-full">
          <div
            className={`py-1 cursor-pointer flex items-center gap-2 w-full h-8 capitalize`}
          >
            <i
              className="bi-folder-fill text-2xl drop-shadow"
              style={{ color: collection.color }}
            ></i>
            <p className="truncate w-full">{collection.name}</p>

            {collection.isPublic ? (
              <i
                className="bi-globe2 text-sm text-black/50 dark:text-white/50 drop-shadow"
                title="This collection is being shared publicly."
              ></i>
            ) : undefined}
            <div className="drop-shadow text-neutral text-xs">
              {collection._count?.links}
            </div>
          </div>
        </Link>
      </summary>

      {hasChildren && (
        <div className="ml-3 pl-1 border-l border-neutral-content">
          {collections
            .filter((e) => e.parentId === collection.id)
            .map((subCollection) => (
              <CollectionItem
                key={subCollection.id}
                collection={subCollection}
                active={active}
                collections={collections}
              />
            ))}
        </div>
      )}
    </details>
  ) : (
    <Link href={`/collections/${collection.id}`} className="w-full">
      <div
        className={`${
          active === `/collections/${collection.id}`
            ? "bg-primary/20"
            : "hover:bg-neutral/20"
        } duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize mb-1`}
      >
        <i
          className="bi-folder-fill text-2xl drop-shadow"
          style={{ color: collection.color }}
        ></i>
        <p className="truncate w-full">{collection.name}</p>

        {collection.isPublic ? (
          <i
            className="bi-globe2 text-sm text-black/50 dark:text-white/50 drop-shadow"
            title="This collection is being shared publicly."
          ></i>
        ) : undefined}
        <div className="drop-shadow text-neutral text-xs">
          {collection._count?.links}
        </div>
      </div>
    </Link>
  );
};
