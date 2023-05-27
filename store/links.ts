// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { create } from "zustand";
import { LinkIncludingCollectionAndTags } from "@/types/global";
import useTagStore from "./tags";
import useCollectionStore from "./collections";

type LinkStore = {
  links: LinkIncludingCollectionAndTags[];
  setLinks: () => void;
  addLink: (body: LinkIncludingCollectionAndTags) => Promise<boolean>;
  updateLink: (link: LinkIncludingCollectionAndTags) => void;
  removeLink: (link: LinkIncludingCollectionAndTags) => void;
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
