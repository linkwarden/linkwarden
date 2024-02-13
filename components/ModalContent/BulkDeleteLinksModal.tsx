import React from "react";
import useLinkStore from "@/store/links";
import toast from "react-hot-toast";
import Modal from "../Modal";

type Props = {
  onClose: Function;
};

export default function BulkDeleteLinksModal({ onClose }: Props) {
  const { selectedLinks, setSelectedLinks, deleteLinksById } = useLinkStore();

  const deleteLink = async () => {
    const load = toast.loading(
      `Deleting ${selectedLinks.length} Link${
        selectedLinks.length > 1 ? "s" : ""
      }...`
    );

    const response = await deleteLinksById(
      selectedLinks.map((link) => link.id as number)
    );

    toast.dismiss(load);

    if (response.ok) {
      toast.success(
        `Deleted ${selectedLinks.length} Link${
          selectedLinks.length > 1 ? "s" : ""
        }`
      );

      setSelectedLinks([]);
      onClose();
    } else toast.error(response.data as string);
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">
        Delete {selectedLinks.length} Link{selectedLinks.length > 1 ? "s" : ""}
      </p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        {selectedLinks.length > 1 ? (
          <p>Are you sure you want to delete {selectedLinks.length} links?</p>
        ) : (
          <p>Are you sure you want to delete this link?</p>
        )}

        <div role="alert" className="alert alert-warning">
          <i className="bi-exclamation-triangle text-xl" />
          <span>
            <b>Warning:</b> This action is irreversible!
          </span>
        </div>

        <p>
          Hold the <kbd className="kbd kbd-sm">Shift</kbd> key while clicking
          &apos;Delete&apos; to bypass this confirmation in the future.
        </p>

        <button
          className={`ml-auto btn w-fit text-white flex items-center gap-2 duration-100 bg-red-500 hover:bg-red-400 hover:dark:bg-red-600 cursor-pointer`}
          onClick={deleteLink}
        >
          <i className="bi-trash text-xl" />
          Delete
        </button>
      </div>
    </Modal>
  );
}
