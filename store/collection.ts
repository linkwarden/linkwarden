import { create } from "zustand";
import { Collection } from "@prisma/client";

type CollectionSlice = {
  collections: Collection[];
  setCollections: () => void;
  addCollection: (collectionName: string) => void;
  updateCollection: (collection: Collection) => void;
  removeCollection: (collectionId: number) => void;
};

const useCollectionSlice = create<CollectionSlice>()((set) => ({
  collections: [],
  setCollections: async () => {
    const response = await fetch("/api/routes/collections");

    const data = await response.json();

    if (response.ok) set({ collections: data.response });
  },
  addCollection: async (collectionName) => {
    const response = await fetch("/api/routes/collections", {
      body: JSON.stringify({ collectionName }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data = await response.json();

    if (response.ok)
      set((state) => ({
        collections: [...state.collections, data.response],
      }));
  },
  updateCollection: (collection) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collection.id ? collection : c
      ),
    })),
  removeCollection: (collectionId) => {
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== collectionId),
    }));
  },
}));

export default useCollectionSlice;
