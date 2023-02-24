import { create } from "zustand";
import { Tag } from "@prisma/client";

type TagSlice = {
  tags: Tag[];
  setTags: () => void;
};

const useTagSlice = create<TagSlice>()((set) => ({
  tags: [],
  setTags: async () => {
    const response = await fetch("/api/routes/tags");

    const data = await response.json();

    if (response.ok) set({ tags: data.response });
  },
}));

export default useTagSlice;
