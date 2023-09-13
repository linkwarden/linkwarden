import { create } from "zustand";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import useTagStore from "./tags";
import useCollectionStore from "./collections";

type ResponseObject = {
  ok: boolean;
  data: object | string;
};

type LinkStore = {
  links: LinkIncludingShortenedCollectionAndTags[];
  setLinks: (
    data: LinkIncludingShortenedCollectionAndTags[],
    isInitialCall: boolean
  ) => void;
  addLink: (
    body: LinkIncludingShortenedCollectionAndTags
  ) => Promise<ResponseObject>;
  updateLink: (
    link: LinkIncludingShortenedCollectionAndTags
  ) => Promise<ResponseObject>;
  removeLink: (
    link: LinkIncludingShortenedCollectionAndTags
  ) => Promise<ResponseObject>;
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
    const response = await fetch("/api/links", {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data = await response.json();

    if (response.ok) {
      set((state) => ({
        links: [data.response, ...state.links],
      }));
      useTagStore.getState().setTags();
      useCollectionStore.getState().setCollections();
    }

    return { ok: response.ok, data: data.response };
  },
  updateLink: async (link) => {
    const response = await fetch("/api/links", {
      body: JSON.stringify(link),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });

    const data = await response.json();

    if (response.ok) {
      set((state) => ({
        links: state.links.map((e) =>
          e.id === data.response.id ? data.response : e
        ),
      }));
      useTagStore.getState().setTags();
      useCollectionStore.getState().setCollections();
    }

    return { ok: response.ok, data: data.response };
  },
  removeLink: async (link) => {
    const response = await fetch("/api/links", {
      body: JSON.stringify(link),
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      set((state) => ({
        links: state.links.filter((e) => e.id !== link.id),
      }));
      useTagStore.getState().setTags();
    }

    return { ok: response.ok, data: data.response };
  },
  resetLinks: () => set({ links: [] }),
}));

export default useLinkStore;
