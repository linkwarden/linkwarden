import { create } from "zustand";
import { TagIncludingLinkCount } from "@/types/global";

type ResponseObject = {
  ok: boolean;
  data: object | string;
};

type TagStore = {
  tags: TagIncludingLinkCount[];
  setTags: () => void;
  updateTag: (tag: TagIncludingLinkCount) => Promise<ResponseObject>;
  removeTag: (tagId: number) => Promise<ResponseObject>;
};

const useTagStore = create<TagStore>()((set) => ({
  tags: [],
  setTags: async () => {
    const response = await fetch("/api/v1/tags");

    const data = await response.json();

    if (response.ok) set({ tags: data.response });
  },
  updateTag: async (tag) => {
    const response = await fetch(`/api/v1/tags/${tag.id}`, {
      body: JSON.stringify(tag),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });

    const data = await response.json();

    if (response.ok) {
      set((state) => ({
        tags: state.tags.map((e) =>
          e.id === data.response.id ? data.response : e
        ),
      }));
    }

    return { ok: response.ok, data: data.response };
  },
  removeTag: async (tagId) => {
    const response = await fetch(`/api/v1/tags/${tagId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      set((state) => ({
        tags: state.tags.filter((e) => e.id !== tagId),
      }));
    }

    const data = await response.json();
    return { ok: response.ok, data: data.response };
  },
}));

export default useTagStore;
