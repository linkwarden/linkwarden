// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import useCollectionStore from "@/store/collections";
import { NewCollection } from "@/types/global";

type Props = {
  toggleCollectionModal: Function;
};

export default function AddCollection({ toggleCollectionModal }: Props) {
  const [newCollection, setNewCollection] = useState<NewCollection>({
    name: "",
    description: "",
  });

  const { addCollection } = useCollectionStore();

  const submitCollection = async () => {
    console.log(newCollection);

    const response = await addCollection(newCollection as NewCollection);

    if (response) toggleCollectionModal();
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="font-bold text-sky-300 mb-2 text-center">New Collection</p>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">Name</p>
        <input
          value={newCollection.name}
          onChange={(e) =>
            setNewCollection({ ...newCollection, name: e.target.value })
          }
          type="text"
          placeholder="e.g. Example Collection"
          className="w-96 rounded-md p-3 border-sky-100 border-solid border text-sm outline-none focus:border-sky-500 duration-100"
        />
      </div>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">Description</p>
        <input
          value={newCollection.description}
          onChange={(e) =>
            setNewCollection({ ...newCollection, description: e.target.value })
          }
          type="text"
          placeholder="Collection description (Optional)"
          className="w-96 rounded-md p-3 border-sky-100 border-solid border text-sm outline-none focus:border-sky-500 duration-100"
        />
      </div>

      <div
        className="mx-auto mt-2 bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
        onClick={submitCollection}
      >
        <FontAwesomeIcon icon={faPlus} className="h-5" />
        Add Collection
      </div>
    </div>
  );
}
