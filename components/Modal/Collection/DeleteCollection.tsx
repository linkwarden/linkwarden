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
    if (!collection.id || collection.name !== inputField) return null;

    const response = await removeCollection(collection.id);
    if (response) {
      toggleDeleteCollectionModal();
      router.push("/collections");
    }
  };

  return (
    <div className="flex flex-col gap-3 justify-between sm:w-[35rem] w-80">
      <p className="text-red-500 font-bold text-center">Warning!</p>

      <div className="max-h-[20rem] overflow-y-auto">
        <div className="text-gray-500">
          <p>
            Please note that deleting the collection will permanently remove all
            its contents, including the following:
          </p>
          <div className="p-3">
            <li className="list-inside">
              Links: All links within the collection will be permanently
              deleted.
            </li>
            <li className="list-inside">
              Tags: All tags associated with the collection will be removed.
            </li>
            <li className="list-inside">
              Screenshots/PDFs: Any screenshots or PDFs attached to links within
              this collection will be permanently deleted.
            </li>
            <li className="list-inside">
              Members: Any members who have been granted access to the
              collection will lose their permissions and no longer be able to
              view or interact with the content.
            </li>
          </div>
          <p>
            Please double-check that you have backed up any essential data and
            have informed the relevant members about this action.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sky-900 select-none text-center">
          To confirm, type &quot;
          <span className="font-bold text-sky-500">{collection.name}</span>
          &quot; in the box below:
        </p>

        <input
          autoFocus
          value={inputField}
          onChange={(e) => setInputField(e.target.value)}
          type="text"
          placeholder={`Type "${collection.name}" Here.`}
          className="w-72 sm:w-96 rounded-md p-3 mx-auto border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
      </div>

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
