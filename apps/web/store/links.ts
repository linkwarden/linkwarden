import { create } from "zustand";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

type ResponseObject = {
  ok: boolean;
  data: object | string;
};

type LinkStore = {
  selectedLinks: LinkIncludingShortenedCollectionAndTags[];
  setSelectedLinks: (links: LinkIncludingShortenedCollectionAndTags[]) => void;
  updateLinks: (
    links: LinkIncludingShortenedCollectionAndTags[],
    removePreviousTags: boolean,
    newData: Pick<
      LinkIncludingShortenedCollectionAndTags,
      "tags" | "collectionId"
    >
  ) => Promise<ResponseObject>;
};

const useLinkStore = create<LinkStore>()((set) => ({
  selectedLinks: [],
  setSelectedLinks: (links) => set({ selectedLinks: links }),
  updateLinks: async (links, removePreviousTags, newData) => {
    const response = await fetch("/api/v1/links", {
      body: JSON.stringify({ links, removePreviousTags, newData }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });

    const data = await response.json();

    if (response.ok) {
      // Update the selected links with the new data
    }

    return { ok: response.ok, data: data.response };
  },
}));

export default useLinkStore;
