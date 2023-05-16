// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { create } from "zustand";
import { Tag } from "@prisma/client";
import tags from "@/pages/api/routes/tags";

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
