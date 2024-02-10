import React, { useEffect, useState } from "react";
import useLinkStore from "@/store/links";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { useRouter } from "next/router";

type Props = {
  onClose: Function;
  activeLink: LinkIncludingShortenedCollectionAndTags;
};

export default function DeleteLinkModal({ onClose, activeLink }: Props) {
  const [link, setLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(activeLink);

  const { removeLink } = useLinkStore();

  const router = useRouter();

  useEffect(() => {
    setLink(activeLink);
  }, []);

  const deleteLink = async () => {
    const load = toast.loading("Deleting...");

    const response = await removeLink(link.id as number);

    toast.dismiss(load);

    response.ok && toast.success(`Link Deleted.`);

    if (router.pathname.startsWith("/links/[id]")) {
      router.push("/dashboard");
    }

    onClose();
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin text-red-500">Delete Link</p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        <p>Are you sure you want to delete this Link?</p>

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
