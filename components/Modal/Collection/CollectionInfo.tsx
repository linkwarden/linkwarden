import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faPlus } from "@fortawesome/free-solid-svg-icons";
import useCollectionStore from "@/store/collections";
import { CollectionIncludingMembers } from "@/types/global";
import RequiredBadge from "../../RequiredBadge";
import SubmitButton from "@/components/SubmitButton";

type Props = {
  toggleCollectionModal: Function;
  activeCollection: CollectionIncludingMembers;
  method: "CREATE" | "UPDATE";
};

export default function CollectionInfo({
  toggleCollectionModal,
  activeCollection,
  method,
}: Props) {
  const [collection, setCollection] =
    useState<CollectionIncludingMembers>(activeCollection);

  const { updateCollection, addCollection } = useCollectionStore();

  const submit = async () => {
    if (!collection) return null;

    let response = null;

    if (method === "CREATE") response = await addCollection(collection);
    else if (method === "UPDATE") response = await updateCollection(collection);
    else console.log("Unknown method.");

    if (response) toggleCollectionModal();
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="text-xl text-sky-500 mb-2 text-center">
        {method === "CREATE" ? "Add" : "Edit"} Collection
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full">
          <p className="text-sm font-bold text-sky-300 mb-2">
            Name
            <RequiredBadge />
          </p>
          <input
            value={collection.name}
            onChange={(e) =>
              setCollection({ ...collection, name: e.target.value })
            }
            type="text"
            placeholder="e.g. Example Collection"
            className="w-full rounded-md p-3 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>

        <div className="w-full">
          <p className="text-sm font-bold text-sky-300 mb-2">Description</p>
          <textarea
            className="w-full h-40 resize-none border rounded-md duration-100 bg-white p-3 outline-none border-sky-100 focus:border-sky-500"
            placeholder="The purpose of this Collection..."
            value={collection.description}
            onChange={(e) =>
              setCollection({
                ...collection,
                description: e.target.value,
              })
            }
          />
        </div>
      </div>

      <SubmitButton
        onClick={submit}
        label={method === "CREATE" ? "Add Collection" : "Edit Collection"}
        icon={method === "CREATE" ? faPlus : faPenToSquare}
        className="mx-auto mt-2"
      />
    </div>
  );
}
