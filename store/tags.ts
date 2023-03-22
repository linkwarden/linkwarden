import { create } from "zustand";
import { Tag } from "@prisma/client";

type TagStore = {
  tags: Tag[];
  setTags: () => void;
};

const useTagStore = create<TagStore>()((set) => ({
  tags: [],
  setTags: async () => {
    const response = await fetch("/api/routes/tags");

    const data = await response.json();

    if (response.ok) set({ tags: data.response });
  },
}));

export default useTagStore;
