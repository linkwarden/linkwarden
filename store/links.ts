import { create } from "zustand";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import useTagStore from "./tags";
import useCollectionStore from "./collections";

type ResponseObject = {
  ok: boolean;
  data: object | string;
};

type LinkStore = {
  links: LinkIncludingShortenedCollectionAndTags[];
  selectedLinks: LinkIncludingShortenedCollectionAndTags[];
  setLinks: (
    data: LinkIncludingShortenedCollectionAndTags[],
    isInitialCall: boolean
  ) => void;
  setSelectedLinks: (links: LinkIncludingShortenedCollectionAndTags[]) => void;
  addLink: (
    body: LinkIncludingShortenedCollectionAndTags
  ) => Promise<ResponseObject>;
  uploadFile: (
    link: LinkIncludingShortenedCollectionAndTags,
    file: File
  ) => Promise<ResponseObject>;
  getLink: (linkId: number, publicRoute?: boolean) => Promise<ResponseObject>;
  updateLink: (
    link: LinkIncludingShortenedCollectionAndTags
  ) => Promise<ResponseObject>;
  updateLinks: (
    links: LinkIncludingShortenedCollectionAndTags[],
    removePreviousTags: boolean,
    newData: Pick<
      LinkIncludingShortenedCollectionAndTags,
      "tags" | "collectionId"
    >
  ) => Promise<ResponseObject>;
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
  setSelectedLinks: (links) => set({ selectedLinks: links }),
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
  uploadFile: async (link, file) => {
    let fileType: ArchivedFormat | null = null;
    let linkType: "url" | "image" | "pdf" | null = null;

    if (file?.type === "image/jpg" || file.type === "image/jpeg") {
      fileType = ArchivedFormat.jpeg;
      linkType = "image";
    } else if (file.type === "image/png") {
      fileType = ArchivedFormat.png;
      linkType = "image";
    } else if (file.type === "application/pdf") {
      fileType = ArchivedFormat.pdf;
      linkType = "pdf";
    } else {
      return { ok: false, data: "Invalid file type." };
    }

    const response = await fetch("/api/v1/links", {
      body: JSON.stringify({
        ...link,
        type: linkType,
        name: link.name ? link.name : file.name,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data = await response.json();

    const createdLink: LinkIncludingShortenedCollectionAndTags = data.response;

    console.log(data);

    if (response.ok) {
      const formBody = new FormData();
      file && formBody.append("file", file);

      await fetch(
        `/api/v1/archives/${(data as any).response.id}?format=${fileType}`,
        {
          body: formBody,
          method: "POST",
        }
      );

      // get file extension
      const extension = file.name.split(".").pop() || "";

      set((state) => ({
        links: [
          {
            ...createdLink,
            image:
              linkType === "image"
                ? `archives/${createdLink.collectionId}/${
                    createdLink.id + extension
                  }`
                : null,
            pdf:
              linkType === "pdf"
                ? `archives/${createdLink.collectionId}/${
                    createdLink.id + ".pdf"
                  }`
                : null,
          },
          ...state.links,
        ],
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
      set((state) => ({
        links: state.links.map((e) =>
          links.some((link) => link.id === e.id)
            ? {
                ...e,
                collectionId: newData.collectionId ?? e.collectionId,
                collection: {
                  ...e.collection,
                  id: newData.collectionId ?? e.collection.id,
                },
                tags: removePreviousTags
                  ? [...(newData.tags ?? [])]
                  : [...e.tags, ...(newData.tags ?? [])],
              }
            : e
        ),
      }));
      useTagStore.getState().setTags();
      useCollectionStore.getState().setCollections();
    }

    return { ok: response.ok, data: data.response };
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
        links: state.links.filter((e) => !linkIds.includes(e.id as number)),
      }));
      useTagStore.getState().setTags();
      useCollectionStore.getState().setCollections();
    }

    return { ok: response.ok, data: data.response };
  },
  resetLinks: () => set({ links: [] }),
}));

export default useLinkStore;
