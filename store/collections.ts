// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { create } from "zustand";
import { Collection } from "@prisma/client";

type CollectionStore = {
  collections: Collection[];
  setCollections: () => void;
  addCollection: (collectionName: string) => void;
  updateCollection: (collection: Collection) => void;
  removeCollection: (collectionId: number) => void;
};

const useCollectionStore = create<CollectionStore>()((set) => ({
  collections: [],
  setCollections: async () => {
    const response = await fetch("/api/routes/collections");

    const data = await response.json();

    if (response.ok) set({ collections: data.response });
  },
  addCollection: async (collectionName) => {
    const response = await fetch("/api/routes/collections", {
      body: JSON.stringify({ collectionName }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data = await response.json();

    if (response.ok)
      set((state) => ({
        collections: [...state.collections, data.response],
      }));
  },
  updateCollection: (collection) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collection.id ? collection : c
      ),
    })),
  removeCollection: (collectionId) => {
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== collectionId),
    }));
  },
}));

export default useCollectionStore;
