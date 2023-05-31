import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { CollectionIncludingMembers } from "@/types/global";
import useCollectionStore from "@/store/collections";
import { useRouter } from "next/router";

type Props = {
  toggleDeleteCollectionModal: Function;
  collection: CollectionIncludingMembers;
};

export default function DeleteCollection({
  toggleDeleteCollectionModal,
  collection,
}: Props) {
  const [inputField, setInputField] = useState("");

  const { removeCollection } = useCollectionStore();

  const router = useRouter();

  const submit = async () => {
    if (!collection.id) return null;

    const response = await removeCollection(collection.id);
    if (response) {
      toggleDeleteCollectionModal();
      router.push("/collections");
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="text-xl text-sky-500 mb-2 text-center">Delete Collection</p>

      <p className="text-sky-900 select-none text-center">
        To confirm, type "
        <span className="font-bold text-sky-500">{collection.name}</span>" in
        the box below:
      </p>

      <input
        autoFocus
        value={inputField}
        onChange={(e) => setInputField(e.target.value)}
        type="text"
        placeholder={`Type "${collection.name}" Here.`}
        className=" w-72 sm:w-96 rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
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
