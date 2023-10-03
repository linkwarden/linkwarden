import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightFromBracket,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import useCollectionStore from "@/store/collections";
import { useRouter } from "next/router";
import usePermissions from "@/hooks/usePermissions";
import { toast } from "react-hot-toast";
import TextInput from "@/components/TextInput";

type Props = {
  toggleDeleteCollectionModal: Function;
  collection: CollectionIncludingMembersAndLinkCount;
};

export default function DeleteCollection({
  toggleDeleteCollectionModal,
  collection,
}: Props) {
  const [inputField, setInputField] = useState("");

  const { removeCollection } = useCollectionStore();

  const router = useRouter();

  const submit = async () => {
    if (permissions === true) if (collection.name !== inputField) return null;

    const load = toast.loading("Deleting...");

    const response = await removeCollection(collection.id as number);

    toast.dismiss(load);

    if (response.ok) {
      toast.success("Collection Deleted.");
      toggleDeleteCollectionModal();
      router.push("/collections");
    }
  };

  const permissions = usePermissions(collection.id as number);

  return (
    <div className="flex flex-col gap-3 justify-between sm:w-[35rem] w-80">
      {permissions === true ? (
        <>
          <p className="text-red-500 font-bold text-center">Warning!</p>

          <div className="max-h-[20rem] overflow-y-auto">
            <div className="text-black dark:text-white">
              <p>
                Please note that deleting the collection will permanently remove
                all its contents, including the following:
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
                  Screenshots/PDFs: Any screenshots or PDFs attached to links
                  within this collection will be permanently deleted.
                </li>
                <li className="list-inside">
                  Members: Any members who have been granted access to the
                  collection will lose their permissions and no longer be able
                  to view or interact with the content.
                </li>
              </div>
              <p>
                Please double-check that you have backed up any essential data
                and have informed the relevant members about this action.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-black dark:text-white text-center">
              To confirm, type &quot;
              <span className="font-bold">{collection.name}</span>
              &quot; in the box below:
            </p>

            <TextInput
              autoFocus={true}
              value={inputField}
              onChange={(e) => setInputField(e.target.value)}
              placeholder={`Type "${collection.name}" Here.`}
              className="w-3/4 mx-auto"
            />
          </div>
        </>
      ) : (
        <p className="text-black dark:text-white">
          Click the button below to leave the current collection.
        </p>
      )}

      <div
        className={`mx-auto mt-2 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold duration-100 ${
          permissions === true
            ? inputField === collection.name
              ? "bg-red-500 hover:bg-red-400 hover:dark:bg-red-600 cursor-pointer"
              : "cursor-not-allowed bg-red-300 dark:bg-red-900"
            : "bg-red-500 hover:bg-red-400 hover:dark:bg-red-600 cursor-pointer"
        }`}
        onClick={submit}
      >
        <FontAwesomeIcon
          icon={permissions === true ? faTrashCan : faRightFromBracket}
          className="h-5"
        />
        {permissions === true ? "Delete" : "Leave"} Collection
      </div>
    </div>
  );
}
