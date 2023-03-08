import React, { useState } from "react";
import CollectionSelection from "./InputSelect/CollectionSelection";
import TagSelection from "./InputSelect/TagSelection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { NewLink } from "@/types/global";
import useLinkSlice from "@/store/links";

export default function ({ toggleLinkModal }: { toggleLinkModal: Function }) {
  const router = useRouter();

  const [newLink, setNewLink] = useState<NewLink>({
    name: "",
    url: "",
    tags: [],
    collection: { id: Number(router.query.id) },
  });

  const { addLink } = useLinkSlice();

  const setTags = (e: any) => {
    const tagNames = e.map((e: any) => {
      return e.label;
    });

    setNewLink({ ...newLink, tags: tagNames });
  };

  const setCollection = (e: any) => {
    const collection = { id: e?.value, isNew: e?.__isNew__ };

    setNewLink({ ...newLink, collection: collection });
  };

  const submitLink = async () => {
    const response = await addLink(newLink);

    if (response) toggleLinkModal();
  };

  return (
    <div className="slide-up border-sky-100 border-solid border rounded-md shadow-lg p-5 bg-white flex flex-col gap-3">
      <p className="font-bold text-sky-300 mb-2 text-center">New Link</p>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">Name</p>
        <input
          value={newLink.name}
          onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
          type="text"
          placeholder="e.g. Example Link"
          className="w-60 rounded p-3 border-sky-100 border-solid border text-sm outline-none focus:border-sky-500 duration-100"
        />
      </div>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">URL</p>
        <input
          value={newLink.url}
          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
          type="text"
          placeholder="e.g. http://example.com/"
          className="w-60 rounded p-3 border-sky-100 border-solid border text-sm outline-none focus:border-sky-500 duration-100"
        />
      </div>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">Tags</p>
        <TagSelection onChange={setTags} />
      </div>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">Collection</p>
        <CollectionSelection onChange={setCollection} />
      </div>

      <div
        className="mx-auto mt-2 bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
        onClick={submitLink}
      >
        <FontAwesomeIcon icon={faPlus} className="h-5" />
        Add Link
      </div>
    </div>
  );
}
