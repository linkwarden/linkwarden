import React, { useEffect, useState } from "react";
import Tree, {
  mutateTree,
  moveItemOnTree,
  RenderItemParams,
  TreeItem,
  TreeData,
  ItemId,
  TreeSourcePosition,
  TreeDestinationPosition,
} from "@atlaskit/tree";
import useCollectionStore from "@/store/collections";
import { Collection } from "@prisma/client";
import Link from "next/link";

interface ExtendedTreeItem extends TreeItem {
  data: Collection;
}

const DragDropWithNestingTree = () => {
  const buildTreeFromCollections = (collections: Collection[]): TreeData => {
    const items: { [key: string]: ExtendedTreeItem } = collections.reduce(
      (acc: any, collection) => {
        acc[collection.id] = {
          id: collection.id,
          children: [],
          hasChildren: false,
          isExpanded: false,
          data: {
            id: collection.id,
            name: collection.name,
            description: collection.description,
            color: collection.color,
            isPublic: collection.isPublic,
            ownerId: collection.ownerId,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
          },
        };
        return acc;
      },
      {}
    );

    collections.forEach((collection) => {
      const parentId = collection.parentId;
      if (parentId && items[parentId]) {
        items[parentId].children.push(collection.id);
        items[parentId].hasChildren = true;
      }
    });

    const rootId = "root";
    items[rootId] = {
      id: rootId,
      children: collections.filter((c) => c.parentId === null).map((c) => c.id),
      hasChildren: true,
      isExpanded: true,
      data: { name: "Root" } as Collection,
    };

    return { rootId, items };
  };

  const [tree, setTree] = useState<TreeData>();

  const { collections } = useCollectionStore();

  useEffect(() => {
    const initialTree = buildTreeFromCollections(
      collections as unknown as Collection[]
    );
    collections[0] && setTree(initialTree);
  }, [collections]);

  const onExpand = (itemId: ItemId) => {
    if (tree) {
      setTree((currentTree) =>
        mutateTree(currentTree!, itemId, { isExpanded: true })
      );
    }
  };

  const onCollapse = (itemId: ItemId) => {
    if (tree) {
      setTree((currentTree) =>
        mutateTree(currentTree as TreeData, itemId, { isExpanded: false })
      );
    }
  };

  const onDragEnd = (
    source: TreeSourcePosition,
    destination: TreeDestinationPosition | undefined
  ) => {
    if (!destination || !tree) {
      return;
    }
    setTree((currentTree) => moveItemOnTree(currentTree!, source, destination));
  };

  if (!tree) {
    return <div>Loading...</div>;
  }

  return (
    <Tree
      tree={tree}
      renderItem={renderItem}
      onExpand={onExpand}
      onCollapse={onCollapse}
      onDragEnd={onDragEnd}
      isDragEnabled
      isNestingEnabled
    />
  );
};

export default DragDropWithNestingTree;

const renderItem = ({
  item,
  onExpand,
  onCollapse,
  provided,
}: RenderItemParams) => {
  const collection = item.data;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className="flex gap-2 items-center ml-2"
    >
      {Icon(item as ExtendedTreeItem, onExpand, onCollapse)}

      <Link
        href={`/collections/${collection.id}`}
        className="w-full"
        {...provided.dragHandleProps}
      >
        <div
          className={`duration-100 py-1 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
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

const Icon = (
  item: ExtendedTreeItem,
  onExpand: (id: ItemId) => void,
  onCollapse: (id: ItemId) => void
) => {
  if (item.children && item.children.length > 0) {
    return item.isExpanded ? (
      <button onClick={() => onCollapse(item.id)}>
        <div className="bi-chevron-down"></div>
      </button>
    ) : (
      <button onClick={() => onExpand(item.id)}>
        <div className="bi-chevron-right"></div>
      </button>
    );
  }
  // return <span>&bull;</span>;
  return <></>;
};
