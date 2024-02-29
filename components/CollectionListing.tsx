import React, { Component, useCallback, useEffect, useState } from "react";
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
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import useCollectionStore from "@/store/collections";

const collections = [
  {
    id: 262,
    name: "dasd",
    description: "",
    color: "#0ea5e9",
    parentId: null,
    isPublic: false,
    ownerId: 1,
    createdAt: "2024-02-18T23:40:44.043Z",
    updatedAt: "2024-02-19T19:16:14.873Z",
    parent: null,
    members: [
      {
        userId: 17,
        collectionId: 262,
        canCreate: true,
        canUpdate: false,
        canDelete: false,
        createdAt: "2024-02-19T19:16:14.873Z",
        updatedAt: "2024-02-19T19:16:14.873Z",
        user: { username: "test", name: "ben", image: "" },
      },
    ],
    _count: { links: 0 },
  },
  {
    id: 268,
    name: "ab",
    description: "",
    color: "#0ea5e9",
    parentId: 267,
    isPublic: false,
    ownerId: 17,
    createdAt: "2024-02-19T21:06:52.545Z",
    updatedAt: "2024-02-19T21:06:52.545Z",
    parent: { id: 267, name: "a" },
    members: [],
    _count: { links: 0 },
  },
  {
    id: 269,
    name: "abc",
    description: "",
    color: "#0ea5e9",
    parentId: 268,
    isPublic: false,
    ownerId: 17,
    createdAt: "2024-02-19T21:07:08.565Z",
    updatedAt: "2024-02-19T21:07:08.565Z",
    parent: { id: 268, name: "ab" },
    members: [],
    _count: { links: 0 },
  },
  {
    id: 267,
    name: "a",
    description: "",
    color: "#0ea5e9",
    parentId: null,
    isPublic: false,
    ownerId: 17,
    createdAt: "2024-02-19T21:06:45.402Z",
    updatedAt: "2024-02-26T16:59:20.312Z",
    parent: null,
    members: [],
    _count: { links: 0 },
  },
  {
    id: 80,
    name: "abc",
    description: "s",
    color: "#0ea5e9",
    parentId: 79,
    isPublic: false,
    ownerId: 1,
    createdAt: "2024-02-05T07:00:46.881Z",
    updatedAt: "2024-02-27T06:11:46.358Z",
    parent: { id: 79, name: "ab" },
    members: [
      {
        userId: 17,
        collectionId: 80,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        createdAt: "2024-02-27T06:11:46.358Z",
        updatedAt: "2024-02-27T06:11:46.358Z",
        user: { username: "test", name: "ben", image: "" },
      },
      {
        userId: 2,
        collectionId: 80,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        createdAt: "2024-02-27T06:11:46.358Z",
        updatedAt: "2024-02-27T06:11:46.358Z",
        user: {
          username: "sarah_connor",
          name: "Sarah Smith",
          image: "uploads/avatar/2.jpg",
        },
      },
    ],
    _count: { links: 0 },
  },
];

const DragDropWithNestingTree = () => {
  const buildTreeFromCollections = (collections) => {
    // Step 1: Map Collections to TreeItems
    const items = collections.reduce((acc, collection) => {
      acc[collection.id] = {
        id: collection.id.toString(),
        children: [],
        hasChildren: false, // Initially assume no children, adjust in Step 2
        isExpanded: false,
        data: {
          title: collection.name,
          description: collection.description,
          color: collection.color,
          isPublic: collection.isPublic,
          ownerId: collection.ownerId,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
        },
      };
      return acc;
    }, {});

    // Step 2: Build Hierarchy
    collections.forEach((collection) => {
      const parentId = collection.parentId;
      if (parentId !== null && items[parentId]) {
        items[parentId].children.push(collection.id.toString());
        items[parentId].hasChildren = true;
      }
    });

    // Define a root item to act as the top-level node of your tree if needed
    const rootId = "root";
    items[rootId] = {
      id: rootId,
      children: collections
        .filter((c) => c.parentId === null)
        .map((c) => c.id.toString()),
      hasChildren: true,
      isExpanded: true,
      data: { title: "Root" },
    };

    return { rootId, items };
  };

  const [tree, setTree] = useState<TreeData>();

  const { collections } = useCollectionStore();

  useEffect(() => {
    const initialTree = buildTreeFromCollections(collections);
    collections[0] && setTree(initialTree);
  }, [collections]);

  const getIcon = useCallback((item, onExpand, onCollapse) => {
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
    return <span>&bull;</span>;
  }, []);

  const renderItem = useCallback(
    ({ item, onExpand, onCollapse, provided }: RenderItemParams) => {
      return (
        <div ref={provided.innerRef} {...provided.draggableProps}>
          <div
            className="flex gap-1 items-center"
            {...provided.dragHandleProps}
          >
            {getIcon(item, onExpand, onCollapse)}
            {item.data ? item.data.title : ""}
          </div>
        </div>
      );
    },
    [getIcon]
  );

  const onExpand = useCallback(
    (itemId: ItemId) => {
      if (tree) {
        setTree((currentTree) =>
          mutateTree(currentTree, itemId, { isExpanded: true })
        );
      }
    },
    [tree]
  );

  const onCollapse = useCallback(
    (itemId: ItemId) => {
      if (tree) {
        setTree((currentTree) =>
          mutateTree(currentTree, itemId, { isExpanded: false })
        );
      }
    },
    [tree]
  );

  const onDragEnd = useCallback(
    (source: TreeSourcePosition, destination?: TreeDestinationPosition) => {
      if (!destination || !tree) {
        return;
      }

      setTree((currentTree) =>
        moveItemOnTree(currentTree, source, destination)
      );
    },
    [tree]
  );

  if (!tree) {
    return <div>Loading...</div>; // or any other loading state representation
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

class TreeBuilder {
  rootId: ItemId;

  items: Record<ItemId, TreeItem>;

  constructor(rootId: ItemId) {
    const rootItem = this._createItem(`${rootId}`);
    this.rootId = rootItem.id;
    this.items = {
      [rootItem.id]: rootItem,
    };
  }

  withLeaf(id: number) {
    const leafItem = this._createItem(`${this.rootId}-${id}`);
    this._addItemToRoot(leafItem.id);
    this.items[leafItem.id] = leafItem;
    return this;
  }

  withSubTree(tree: TreeBuilder) {
    const subTree = tree.build();
    this._addItemToRoot(`${this.rootId}-${subTree.rootId}`);

    Object.keys(subTree.items).forEach((itemId) => {
      const finalId = `${this.rootId}-${itemId}`;
      this.items[finalId] = {
        ...subTree.items[itemId],
        id: finalId,
        children: subTree.items[itemId].children.map(
          (i) => `${this.rootId}-${i}`
        ),
      };
    });

    return this;
  }

  build() {
    return {
      rootId: this.rootId,
      items: this.items,
    };
  }

  _addItemToRoot(id: string) {
    const rootItem = this.items[this.rootId];
    rootItem.children.push(id);
    rootItem.isExpanded = true;
    rootItem.hasChildren = true;
  }

  _createItem = (id: string) => {
    return {
      id: `${id}`,
      children: [],
      hasChildren: false,
      isExpanded: false,
      isChildrenLoading: false,
      data: {
        title: `Title ${id}`,
      },
    };
  };
}

const complexTree: TreeData = new TreeBuilder(1)
  .withLeaf(0) // 0
  .withLeaf(1) // 1
  .withSubTree(
    new TreeBuilder(2) // 2
      .withLeaf(0) // 3
      .withLeaf(1) // 4
      .withLeaf(2) // 5
      .withLeaf(3) // 6
  )
  .withLeaf(3) // 7
  .withLeaf(4) // 8
  .withLeaf(5) // 9
  .withSubTree(
    new TreeBuilder(6) // 10
      .withLeaf(0) // 11
      .withLeaf(1) // 12
      .withSubTree(
        new TreeBuilder(2) // 13
          .withLeaf(0) // 14
          .withLeaf(1) // 15
          .withLeaf(2) // 16
      )
      .withLeaf(3) // 17
      .withLeaf(4) // 18
  )
  .withLeaf(7) // 19
  .withLeaf(8) // 20
  .build();
