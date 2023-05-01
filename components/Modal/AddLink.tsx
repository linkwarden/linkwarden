// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import React, { useEffect, useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { ExtendedLink, NewLink } from "@/types/global";
import useLinkStore from "@/store/links";
import { useRouter } from "next/router";
import useCollectionStore from "@/store/collections";
import RequiredBadge from "../RequiredBadge";

type Props = {
  toggleLinkModal: Function;
};

export default function AddLink({ toggleLinkModal }: Props) {
  const router = useRouter();
  const [newLink, setNewLink] = useState<NewLink>({
    name: "",
    url: "",
    tags: [],
    collection: {
      id: undefined,
      name: "",
      ownerId: undefined,
    },
  });

  const { addLink } = useLinkStore();
  const { collections } = useCollectionStore();

  useEffect(() => {
    if (router.query.id) {
      const currentCollection = collections.find(
        (e) => e.id == Number(router.query.id)
      );

      setNewLink({
        ...newLink,
        collection: {
          id: currentCollection?.id,
          name: currentCollection?.name,
          ownerId: currentCollection?.ownerId,
        },
      });
    }
  }, []);

  const setTags = (e: any) => {
    const tagNames = e.map((e: any) => {
      return { name: e.label };
    });

    setNewLink({ ...newLink, tags: tagNames });
  };

  const setCollection = (e: any) => {
    if (e?.__isNew__) e.value = null;

    setNewLink({
      ...newLink,
      collection: { id: e?.value, name: e?.label, ownerId: e?.ownerId },
    });
  };

  const submit = async () => {
    console.log(newLink);

    const response = await addLink(newLink as NewLink);

    if (response) toggleLinkModal();
  };
  return (
    <div className="flex flex-col gap-3 sm:w-96 w-80">
      <p className="font-bold text-sky-300 mb-2 text-center">New Link</p>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">
          Name
          <RequiredBadge />
        </p>
        <input
          value={newLink.name}
          onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
          type="text"
          placeholder="e.g. Example Link"
          className="w-60 rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
      </div>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">
          URL
          <RequiredBadge />
        </p>
        <input
          value={newLink.url}
          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
          type="text"
          placeholder="e.g. http://example.com/"
          className="w-60 rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
      </div>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">
          Collection
          <RequiredBadge />
        </p>
        <CollectionSelection
          defaultValue={
            newLink.collection.name && newLink.collection.id
              ? { value: newLink.collection.id, label: newLink.collection.name }
              : undefined
          }
          onChange={setCollection}
        />
      </div>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">Tags</p>
        <TagSelection onChange={setTags} />
      </div>

      <div
        className="mx-auto mt-2 bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
        onClick={submit}
      >
        <FontAwesomeIcon icon={faPlus} className="h-5" />
        Add Link
      </div>
    </div>
  );
}
