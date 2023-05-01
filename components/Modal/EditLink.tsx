// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import React, { useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ExtendedLink } from "@/types/global";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import useLinkStore from "@/store/links";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import RequiredBadge from "../RequiredBadge";

type Props = {
  toggleLinkModal: Function;
  link: ExtendedLink;
};

export default function EditLink({ toggleLinkModal, link }: Props) {
  const [currentLink, setCurrentLink] = useState<ExtendedLink>(link);

  const { updateLink, removeLink } = useLinkStore();

  const shortendURL = new URL(link.url).host.toLowerCase();

  const setTags = (e: any) => {
    const tagNames = e.map((e: any) => {
      return { name: e.label };
    });

    setCurrentLink({ ...currentLink, tags: tagNames });
  };

  const setCollection = (e: any) => {
    if (e?.__isNew__) e.value = null;

    setCurrentLink({
      ...currentLink,
      collection: { id: e?.value, name: e?.label, ownerId: e?.ownerId } as any,
    });
  };

  const submit = async () => {
    updateLink(currentLink);
    toggleLinkModal();
  };

  return (
    <div className="flex flex-col gap-3 sm:w-96 w-80">
      <p className="font-bold text-sky-300 mb-2 text-center">Edit Link</p>
      <p className="text-sky-700">
        <b>{shortendURL}</b> | {link.title}
      </p>
      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">
          Name
          <RequiredBadge />
        </p>
        <input
          value={currentLink.name}
          onChange={(e) =>
            setCurrentLink({ ...currentLink, name: e.target.value })
          }
          type="text"
          placeholder="e.g. Example Link"
          className="w-60 rounded-md p-3 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
      </div>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">
          Collection
          <RequiredBadge />
        </p>
        <CollectionSelection
          onChange={setCollection}
          defaultValue={{
            label: link.collection.name,
            value: link.collection.id,
          }}
        />
      </div>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">Tags</p>
        <TagSelection
          onChange={setTags}
          defaultValue={link.tags.map((e) => {
            return { label: e.name, value: e.id };
          })}
        />
      </div>

      <div className="flex flex-col justify-center items-center gap-2 mt-2">
        <div
          className="bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
          onClick={submit}
        >
          <FontAwesomeIcon icon={faPenToSquare} className="h-5" />
          Edit Link
        </div>

        <div className="flex items-center justify-center gap-2">
          <hr className="w-16 border" />

          <p className="text-gray-400 font-bold">OR</p>

          <hr className="w-16 border" />
        </div>

        <div
          onClick={() => {
            removeLink(link);
            toggleLinkModal();
          }}
          className="w-fit inline-flex rounded-md cursor-pointer bg-red-500 hover:bg-red-400 duration-100 p-2"
        >
          <FontAwesomeIcon icon={faTrashCan} className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}
