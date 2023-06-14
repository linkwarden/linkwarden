import { create } from "zustand";
import { CollectionIncludingMembers } from "@/types/global";
import useTagStore from "./tags";

type CollectionStore = {
  collections: CollectionIncludingMembers[];
  setCollections: () => void;
  addCollection: (body: CollectionIncludingMembers) => Promise<boolean>;
  updateCollection: (
    collection: CollectionIncludingMembers
  ) => Promise<boolean>;
  removeCollection: (collectionId: number) => Promise<boolean>;
};

const useCollectionStore = create<CollectionStore>()((set) => ({
  collections: [],
  setCollections: async () => {
    const response = await fetch("/api/routes/collections");

    const data = await response.json();

    if (response.ok) set({ collections: data.response });
  },
  addCollection: async (body) => {
    const response = await fetch("/api/routes/collections", {
      body: JSON.stringify(body),
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

    return response.ok;
  },
  updateCollection: async (collection) => {
    const response = await fetch("/api/routes/collections", {
      body: JSON.stringify(collection),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });

    const data = await response.json();

    console.log(data);

    if (response.ok)
      set((state) => ({
        collections: state.collections.map((e) =>
          e.id === data.response.id ? data.response : e
        ),
      }));

    return response.ok;
  },
  removeCollection: async (id) => {
    const response = await fetch("/api/routes/collections", {
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });

    const data = await response.json();

    console.log(data);

    if (response.ok) {
      set((state) => ({
        collections: state.collections.filter((e) => e.id !== id),
      }));
      useTagStore.getState().setTags();
    }

    return response.ok;
  },
}));

export default useCollectionStore;
