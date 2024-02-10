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
  selectedLinks: number[];
  setLinks: (
    data: LinkIncludingShortenedCollectionAndTags[],
    isInitialCall: boolean
  ) => void;
  setSelectedLinks: (linkIds: number[]) => void;
  addLink: (
    body: LinkIncludingShortenedCollectionAndTags
  ) => Promise<ResponseObject>;
  getLink: (linkId: number, publicRoute?: boolean) => Promise<ResponseObject>;
  updateLink: (
    link: LinkIncludingShortenedCollectionAndTags
  ) => Promise<ResponseObject>;
  updateLinksById: (linkIds: number[], data: Partial<LinkIncludingShortenedCollectionAndTags>) => Promise<ResponseObject>;
  removeLink: (linkId: number) => Promise<ResponseObject>;
  deleteLinksById: (linkIds: number[]) => Promise<ResponseObject>;
  resetLinks: () => void;
};

const useLinkStore = create<LinkStore>()((set) => ({
  links: [],
  selectedLinks: [],
  setLinks: async (data, isInitialCall) => {
    isInitialCall &&
      set(() => ({
        links: [],
      }));
    set((state) => ({
      // Filter duplicate links by id
      links: [...state.links, ...data].reduce(
        (links: LinkIncludingShortenedCollectionAndTags[], item) => {
          if (!links.some((link) => link.id === item.id)) {
            links.push(item);
          }
          return links;
        },
        []
      ),
    }));
  },
  setSelectedLinks: (linkIds) => set({ selectedLinks: linkIds }),
  addLink: async (body) => {
    const response = await fetch("/api/v1/links", {
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
  getLink: async (linkId, publicRoute) => {
    const path = publicRoute
      ? `/api/v1/public/links/${linkId}`
      : `/api/v1/links/${linkId}`;

    const response = await fetch(path);

    const data = await response.json();

    if (response.ok) {
      set((state) => {
        const linkExists = state.links.some(
          (link) => link.id === data.response.id
        );

        if (linkExists) {
          return {
            links: state.links.map((e) =>
              e.id === data.response.id ? data.response : e
            ),
          };
        } else {
          return {
            links: [...state.links, data.response],
          };
        }
      });

      return data;
    }

    return { ok: response.ok, data: data.response };
  },
  updateLink: async (link) => {
    const response = await fetch(`/api/v1/links/${link.id}`, {
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
  updateLinksById: async (linkIds, data) => {
    const response = await fetch("/api/v1/links", {
      body: JSON.stringify({ linkIds, data }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });

    const responseData = await response.json();

    if (response.ok) {
      set((state) => ({
        links: state.links.map((link) =>
          linkIds.includes(link.id) ? { ...link, ...data } : link
        ),
      }));
      useTagStore.getState().setTags();
      useCollectionStore.getState().setCollections();
    }

    return { ok: response.ok, data: responseData.response };
  },
  removeLink: async (linkId) => {
    const response = await fetch(`/api/v1/links/${linkId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      set((state) => ({
        links: state.links.filter((e) => e.id !== linkId),
      }));
      useTagStore.getState().setTags();
      useCollectionStore.getState().setCollections();
    }

    return { ok: response.ok, data: data.response };
  },
  deleteLinksById: async (linkIds: number[]) => {
    const response = await fetch("/api/v1/links", {
      body: JSON.stringify({ linkIds }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      set((state) => ({
        links: state.links.filter((e) => !linkIds.includes(e.id)),
      }));
      useTagStore.getState().setTags();
      useCollectionStore.getState().setCollections();
    }

    return { ok: response.ok, data: data.response };
  },
  resetLinks: () => set({ links: [] }),
}));

export default useLinkStore;
