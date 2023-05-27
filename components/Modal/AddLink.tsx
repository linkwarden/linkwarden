// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import React, { useEffect, useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { LinkIncludingCollectionAndTags } from "@/types/global";
import useLinkStore from "@/store/links";
import { useRouter } from "next/router";
import useCollectionStore from "@/store/collections";
import RequiredBadge from "../RequiredBadge";

type Props = {
  toggleLinkModal: Function;
};

export default function AddLink({ toggleLinkModal }: Props) {
  const router = useRouter();
  const [link, setLink] = useState<LinkIncludingCollectionAndTags>({
    name: "",
    url: "",
    title: "",
    screenshotPath: "",
    pdfPath: "",
    tags: [],
    collection: {
      name: "",
      description: "",
      ownerId: 1,
    },
  });

  const { addLink } = useLinkStore();
  const { collections } = useCollectionStore();

  useEffect(() => {
    if (router.query.id) {
      const currentCollection = collections.find(
        (e) => e.id == Number(router.query.id)
      );

      if (currentCollection)
        setLink({
          ...link,
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

    setLink({ ...link, tags: tagNames });
  };

  const setCollection = (e: any) => {
    if (e?.__isNew__) e.value = null;

    setLink({
      ...link,
      collection: { id: e?.value, name: e?.label, ownerId: e?.ownerId },
    });
  };

  const submit = async () => {
    console.log(link);

    const response = await addLink(link);

    if (response) toggleLinkModal();
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="text-xl text-sky-500 mb-2 text-center">New Link</p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <p className="text-sm font-bold text-sky-300 mb-2">
            Name
            <RequiredBadge />
          </p>
          <input
            value={link.name}
            onChange={(e) => setLink({ ...link, name: e.target.value })}
            type="text"
            placeholder="e.g. Example Link"
            className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>

        <div>
          <p className="text-sm font-bold text-sky-300 mb-2">
            URL
            <RequiredBadge />
          </p>
          <input
            value={link.url}
            onChange={(e) => setLink({ ...link, url: e.target.value })}
            type="text"
            placeholder="e.g. http://example.com/"
            className="w-full rounded-md p-2 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>

        <div>
          <p className="text-sm font-bold text-sky-300 mb-2">
            Collection
            <RequiredBadge />
          </p>
          <CollectionSelection
            defaultValue={
              link.collection.name && link.collection.id
                ? {
                    value: link.collection.id,
                    label: link.collection.name,
                  }
                : undefined
            }
            onChange={setCollection}
          />
        </div>

        <div>
          <p className="text-sm font-bold text-sky-300 mb-2">Tags</p>
          <TagSelection onChange={setTags} />
        </div>
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
