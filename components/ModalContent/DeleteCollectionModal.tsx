import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import useCollectionStore from "@/store/collections";
import toast from "react-hot-toast";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import { useRouter } from "next/router";
import usePermissions from "@/hooks/usePermissions";
import Modal from "../Modal";

type Props = {
  onClose: Function;
  activeCollection: CollectionIncludingMembersAndLinkCount;
};

export default function DeleteCollectionModal({
  onClose,
  activeCollection,
}: Props) {
  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(activeCollection);

  useEffect(() => {
    setCollection(activeCollection);
  }, []);

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
        onClose();
        router.push("/collections");
      } else toast.error(response.data as string);

      setSubmitLoader(false);
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">
        {permissions === true ? "Delete" : "Leave"} Collection
      </p>

      <div className="divider mb-3 mt-1"></div>

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
              <i className="bi-exclamation-triangle text-xl"></i>
              <span>
                <b>Warning:</b> Deleting this collection will permanently erase
                all its contents, and it will become inaccessible to everyone,
                including members with previous access.
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
          <i className="bi-trash text-xl"></i>
          {permissions === true ? "Delete" : "Leave"} Collection
        </button>
      </div>
    </Modal>
  );
}
