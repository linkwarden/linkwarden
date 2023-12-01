import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import useCollectionStore from "@/store/collections";
import toast, { Toaster } from "react-hot-toast";
import {
  faFolder,
  faRightFromBracket,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { HexColorPicker } from "react-colorful";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import { useRouter } from "next/router";
import usePermissions from "@/hooks/usePermissions";

type Props = {
  modalId: string;
  isOpen: boolean;
  onClose: Function;
  activeCollection: CollectionIncludingMembersAndLinkCount;
};

export default function DeleteCollectionModal({
  modalId,
  isOpen,
  onClose,
  activeCollection,
}: Props) {
  const modal = document.getElementById(modalId);

  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(activeCollection);

  useEffect(() => {
    modal?.scrollTo(0, 0);

    setCollection(activeCollection);
    setInputField("");

    modal?.addEventListener("close", () => {
      onClose();
    });

    return () => {
      modal?.addEventListener("close", () => {
        onClose();
      });
    };
  }, [isOpen]);

  const [submitLoader, setSubmitLoader] = useState(false);
  const { removeCollection } = useCollectionStore();
  const router = useRouter();
  const [inputField, setInputField] = useState("");

  const permissions = usePermissions(collection.id as number);

  const submit = async () => {
    if (permissions === true) if (collection.name !== inputField) return null;

    if (!submitLoader) {
      setSubmitLoader(true);
      if (!collection) return null;

      setSubmitLoader(true);

      const load = toast.loading("Deleting...");

      let response;

      response = await removeCollection(collection.id as any);

      toast.dismiss(load);

      if (response.ok) {
        toast.success(`Deleted.`);
        (document.getElementById(modalId) as any).close();
        router.push("/collections");
      } else toast.error(response.data as string);

      setSubmitLoader(false);
    }
  };

  return (
    <dialog
      id={modalId}
      className="modal backdrop-blur-sm overflow-y-auto p-5"
      open={isOpen}
    >
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className:
            "border border-sky-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white",
        }}
      />
      <div className="modal-box max-h-full overflow-y-visible border border-neutral-content w-11/12 max-w-2xl">
        <form method="dialog">
          <button className="btn btn-sm outline-none btn-circle btn-ghost absolute right-3 top-3">
            ✕
          </button>
        </form>

        <p className="text-xl mb-5 font-thin text-red-500">
          {permissions === true ? "Delete" : "Leave"} Collection
        </p>

        <div className="flex flex-col gap-3">
          {permissions === true ? (
            <>
              <div className="flex flex-col gap-3">
                <p>
                  To confirm, type &quot;
                  <span className="font-bold">{collection.name}</span>
                  &quot; in the box below:
                </p>

                <TextInput
                  value={inputField}
                  onChange={(e) => setInputField(e.target.value)}
                  placeholder={`Type "${collection.name}" Here.`}
                  className="w-3/4 mx-auto"
                />
              </div>

              <div role="alert" className="alert alert-warning">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>
                  <b>
                    Warning: Deleting this collection will permanently erase all
                    its contents
                  </b>
                  , and it will become inaccessible to everyone, including
                  members with previous access.
                </span>
              </div>
            </>
          ) : (
            <p>Click the button below to leave the current collection.</p>
          )}

          <button
            disabled={permissions === true && inputField !== collection.name}
            className={`ml-auto btn w-fit text-white flex items-center gap-2 duration-100 ${
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
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
