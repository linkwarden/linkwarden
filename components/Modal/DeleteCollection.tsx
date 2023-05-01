// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { ExtendedCollection } from "@/types/global";
import useCollectionStore from "@/store/collections";
import { useRouter } from "next/router";

type Props = {
  toggleCollectionModal: Function;
  collection: ExtendedCollection;
};

export default function AddCollection({
  toggleCollectionModal,
  collection,
}: Props) {
  const [inputField, setInputField] = useState("");

  const { removeCollection } = useCollectionStore();

  const router = useRouter();

  const submit = async () => {
    const response = await removeCollection(collection.id);
    if (response) {
      toggleCollectionModal();
      router.push("/collections");
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[33rem] w-72">
      <p className="font-bold text-sky-300 text-center">Delete Collection</p>

      <p className="text-sky-900 select-none text-center">
        To confirm, type "
        <span className="font-bold text-sky-500">{collection.name}</span>" in
        the box below:
      </p>

      <input
        value={inputField}
        onChange={(e) => setInputField(e.target.value)}
        type="text"
        placeholder={`Type "${collection.name}" Here.`}
        className=" w-72 sm:w-96 rounded-md p-3 mx-auto border-sky-100 border-solid border text-sm outline-none focus:border-sky-500 duration-100"
      />

      <div
        className={`mx-auto mt-2  text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold duration-100 ${
          inputField === collection.name
            ? "bg-red-500 hover:bg-red-400 cursor-pointer"
            : "cursor-not-allowed bg-red-300"
        }`}
        onClick={submit}
      >
        <FontAwesomeIcon icon={faTrashCan} className="h-5" />
        Delete Collection
      </div>
    </div>
  );
}
