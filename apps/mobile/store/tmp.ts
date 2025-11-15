import { create } from "zustand";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import { User } from "@linkwarden/prisma/client";

type Tmp = {
  link: LinkIncludingShortenedCollectionAndTags | null;
  user: Pick<User, "id"> | null;
};

type TmpStore = {
  tmp: Tmp;
  updateTmp: (newData: Partial<Tmp>) => void;
};

const useTmpStore = create<TmpStore>((set, get) => ({
  tmp: {
    link: null,
    user: null,
  },
  updateTmp: async (patch) => {
    const merged = { ...get().tmp, ...patch };
    set({ tmp: merged });
  },
}));

export default useTmpStore;
