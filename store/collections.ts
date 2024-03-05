import { create } from "zustand";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import useTagStore from "./tags";

type ResponseObject = {
  ok: boolean;
  data: object | string;
};

type CollectionStore = {
  collections: CollectionIncludingMembersAndLinkCount[];
  setCollections: () => void;
  addCollection: (
    body: CollectionIncludingMembersAndLinkCount
  ) => Promise<ResponseObject>;
  updateCollection: (
    collection: CollectionIncludingMembersAndLinkCount
  ) => Promise<ResponseObject>;
  removeCollection: (collectionId: number) => Promise<ResponseObject>;
};

const useCollectionStore = create<CollectionStore>()((set) => ({
  collections: [],
  setCollections: async () => {
    const response = await fetch("/api/v1/collections");

    const data = await response.json();

    if (response.ok) set({ collections: data.response });
  },
  addCollection: async (body) => {
    const response = await fetch("/api/v1/collections", {
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

    return { ok: response.ok, data: data.response };
  },
  updateCollection: async (collection) => {
    const response = await fetch(`/api/v1/collections/${collection.id}`, {
      body: JSON.stringify(collection),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });

    const data = await response.json();

    if (response.ok)
      set((state) => ({
        collections: state.collections.map((e) =>
          e.id === data.response.id ? data.response : e
        ),
      }));

    return { ok: response.ok, data: data.response };
  },
  removeCollection: async (collectionId) => {
    const response = await fetch(`/api/v1/collections/${collectionId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      set((state) => ({
        collections: state.collections.filter(
          (collection) =>
            collection.id !== collectionId &&
            collection.parentId !== collectionId
        ),
      }));
      useTagStore.getState().setTags();
    }

    return { ok: response.ok, data: data.response };
  },
}));

export default useCollectionStore;
