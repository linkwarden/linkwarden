import useAccountStore from "@/store/account";
import useCollectionStore from "@/store/collections";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
} from "react-beautiful-dnd";
import { StrictModeDroppable as Droppable } from "./StrictModeDroppable";

type Props = {
  links: boolean;
};

const CollectionSelection = ({ links }: Props) => {
  const { collections } = useCollectionStore();
  const { account, updateAccount } = useAccountStore();
  // Use local state to store the collection order so we don't have to wait for a response from the API to update the UI
  const [localCollectionOrder, setLocalCollectionOrder] = useState<
    number[] | []
  >([]);
  const [active, setActive] = useState("");
  const router = useRouter();

  useEffect(() => {
    setActive(router.asPath);
    setLocalCollectionOrder(account.collectionOrder || []);

    if (!account.collectionOrder || account.collectionOrder.length === 0) {
      updateAccount({
        ...account,
        collectionOrder: collections
          .filter((e) => e.parentId === null) // Filter out collections with non-null parentId
          .map((e) => e.id as number), // Use "as number" to assert that e.id is a number
      });
    }
  }, [router, collections, account]);

  return (
    <DragDropContext
      onDragEnd={(result) => {
        if (!result.destination) {
          return; // Dragged outside the droppable area, do nothing
        }

        const updatedCollectionOrder = [...account.collectionOrder];
        const [movedCollectionId] = updatedCollectionOrder.splice(
          result.source.index,
          1
        );
        updatedCollectionOrder.splice(
          result.destination.index,
          0,
          movedCollectionId
        );

        // Update local state with the new collection order
        setLocalCollectionOrder(updatedCollectionOrder);

        // Update account with the new collection order
        updateAccount({
          ...account,
          collectionOrder: updatedCollectionOrder,
        });
      }}
    >
      <Droppable droppableId="collections">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {localCollectionOrder?.map((collectionId, index) => {
              const collection = collections.find((c) => c.id === collectionId);

              if (collection) {
                return (
                  <Draggable
                    key={collection.id}
                    draggableId={`collection-${collection.id}`}
                    index={index}
                  >
                    {(provided) => (
                      <CollectionItem
                        innerRef={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        key={index}
                        collection={collection}
                        active={active}
                        collections={collections}
                      />
                    )}
                  </Draggable>
                );
              }
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default CollectionSelection;

const CollectionItem = ({
  collection,
  active,
  collections,
  innerRef,
  ...props
}: {
  collection: CollectionIncludingMembersAndLinkCount;
  active: string;
  collections: CollectionIncludingMembersAndLinkCount[];
  innerRef?: DraggableProvided["innerRef"];
}) => {
  const hasChildren = collections.some((e) => e.parentId === collection.id);

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
    <>
      <div
        ref={innerRef}
        {...props}
        className={`${
          active === `/collections/${collection.id}`
            ? "bg-primary/20"
            : "hover:bg-neutral/20"
        } duration-100 rounded-md flex w-full items-center cursor-pointer mb-1 px-2 gap-1`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center"
        >
          <i
            className={`bi-chevron-down ${
              isOpen ? "rotate-reverse" : "rotate"
            }`}
          ></i>
        </button>
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
      </div>
      {isOpen && hasChildren && (
        <div className="ml-4 pl-1 border-l border-neutral-content">
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
    </>
  ) : (
    <div ref={innerRef} {...props}>
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
    </div>
  );
};
