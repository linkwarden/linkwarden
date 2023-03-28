import { create } from "zustand";
import { ExtendedLink } from "@/types/global";
import useTagStore from "./tags";
import useCollectionStore from "./collections";

type LinkStore = {
  links: ExtendedLink[];
  setLinks: () => void;
  addLink: (linkName: ExtendedLink) => Promise<boolean>;
  updateLink: (link: ExtendedLink) => void;
  removeLink: (link: ExtendedLink) => void;
};

const useLinkStore = create<LinkStore>()((set) => ({
  links: [],
  setLinks: async () => {
    const response = await fetch("/api/routes/links");

    const data = await response.json();

    if (response.ok) set({ links: data.response });
  },
  addLink: async (newLink) => {
    const response = await fetch("/api/routes/links", {
      body: JSON.stringify(newLink),
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
    console.log(link);

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
        links: state.links.map((e) => (e.id === link.id ? link : e)),
      }));
      useTagStore.getState().setTags();
    }
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
