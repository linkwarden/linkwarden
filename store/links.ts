import { create } from "zustand";
import { LinkAndTags, NewLink } from "@/types/global";

type LinkSlice = {
  links: LinkAndTags[];
  setLinks: () => void;
  addLink: (linkName: NewLink) => Promise<boolean>;
  updateLink: (link: LinkAndTags) => void;
  removeLink: (linkId: number) => void;
};

const useLinkSlice = create<LinkSlice>()((set) => ({
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

    if (response.ok)
      set((state) => ({
        links: [...state.links, data.response],
      }));

    return response.ok;
  },
  updateLink: (link) =>
    set((state) => ({
      links: state.links.map((c) => (c.id === link.id ? link : c)),
    })),
  removeLink: (linkId) => {
    set((state) => ({
      links: state.links.filter((c) => c.id !== linkId),
    }));
  },
}));

export default useLinkSlice;
