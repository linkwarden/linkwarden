import { create } from "zustand";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import useTagStore from "./tags";
import useCollectionStore from "./collections";

type LinkStore = {
  links: LinkIncludingShortenedCollectionAndTags[];
  setLinks: (
    data: LinkIncludingShortenedCollectionAndTags[],
    isInitialCall: boolean
  ) => void;
  addLink: (body: LinkIncludingShortenedCollectionAndTags) => Promise<boolean>;
  updateLink: (
    link: LinkIncludingShortenedCollectionAndTags
  ) => Promise<boolean>;
  removeLink: (
    link: LinkIncludingShortenedCollectionAndTags
  ) => Promise<boolean>;
  resetLinks: () => void;
};

const useLinkStore = create<LinkStore>()((set) => ({
  links: [],
  setLinks: async (data, isInitialCall) => {
    isInitialCall &&
      set(() => ({
        links: [],
      }));
    set((state) => ({
      links: [...state.links, ...data],
    }));
  },
  addLink: async (body) => {
    const response = await fetch("/api/routes/links", {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data = await response.json();

    console.log(data);

    if (response.ok) {
      set((state) => ({
        links: [data.response, ...state.links],
      }));
      useTagStore.getState().setTags();
      useCollectionStore.getState().setCollections();
    }

    return response.ok;
  },
  updateLink: async (link) => {
    const response = await fetch("/api/routes/links", {
      body: JSON.stringify(link),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });

    const data = await response.json();

    console.log(data);

    if (response.ok) {
      set((state) => ({
        links: state.links.map((e) =>
          e.id === data.response.id ? data.response : e
        ),
      }));
      useTagStore.getState().setTags();
      useCollectionStore.getState().setCollections();
    }

    return response.ok;
  },
  removeLink: async (link) => {
    const response = await fetch("/api/routes/links", {
      body: JSON.stringify(link),
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });

    const data = await response.json();

    console.log(data);

    if (response.ok) {
      set((state) => ({
        links: state.links.filter((e) => e.id !== link.id),
      }));
      useTagStore.getState().setTags();
    }

    return response.ok;
  },
  resetLinks: () => set({ links: [] }),
}));

export default useLinkStore;
