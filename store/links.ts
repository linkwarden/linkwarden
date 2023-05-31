import { create } from "zustand";
import { LinkIncludingCollectionAndTags } from "@/types/global";
import useTagStore from "./tags";
import useCollectionStore from "./collections";

type LinkStore = {
  links: LinkIncludingCollectionAndTags[];
  setLinks: () => void;
  addLink: (body: LinkIncludingCollectionAndTags) => Promise<boolean>;
  updateLink: (link: LinkIncludingCollectionAndTags) => Promise<boolean>;
  removeLink: (link: LinkIncludingCollectionAndTags) => Promise<boolean>;
};

const useLinkStore = create<LinkStore>()((set) => ({
  links: [],
  setLinks: async () => {
    const response = await fetch("/api/routes/links");

    const data = await response.json();

    if (response.ok) set({ links: data.response });
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
        links: [...state.links, data.response],
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
}));

export default useLinkStore;
