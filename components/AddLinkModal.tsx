import React, { useState } from "react";
import CollectionSelection from "./InputSelect/CollectionSelection";
import TagSelection from "./InputSelect/TagSelection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
interface NewLink {
  name: string;
  url: string;
  tags: string[];
  collectionId:
    | {
        id: string | number;
        isNew: boolean | undefined;
      }
    | object;
}

export default function () {
  const [newLink, setNewLink] = useState<NewLink>({
    name: "",
    url: "",
    tags: [],
    collectionId: {},
  });

  const setTags = (e: any) => {
    const tagNames = e.map((e: any) => {
      return e.label;
    });

    setNewLink({ ...newLink, tags: tagNames });
  };

  const setCollection = (e: any) => {
    const collection = { id: e?.value, isNew: e?.__isNew__ };

    setNewLink({ ...newLink, collectionId: collection });
  };

  const postLink = async () => {
    const response = await fetch("/api/routes/links", {
      body: JSON.stringify(newLink),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data = await response.json();

    console.log(newLink);

    console.log(data);
  };

  return (
    <div className="border-sky-100 border-solid border rounded-md shadow-lg p-5 bg-white flex flex-col gap-3">
      <p className="font-bold text-sky-300 mb-2 text-center">New Link</p>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">Name</p>
        <input
          value={newLink.name}
          onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
          type="text"
          placeholder="e.g. Example Link"
          className="w-60 rounded p-2 border-sky-100 border-solid border text-sm outline-none focus:border-sky-500 duration-100"
          autoFocus
        />
      </div>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">URL</p>
        <input
          value={newLink.url}
          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
          type="text"
          placeholder="e.g. http://example.com/"
          className="w-60 rounded p-2 border-sky-100 border-solid border text-sm outline-none focus:border-sky-500 duration-100"
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
        onClick={() => postLink()}
      >
        <FontAwesomeIcon icon={faPlus} className="h-5" />
        Add Link
      </div>
    </div>
  );
}
