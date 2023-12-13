import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import TextInput from "@/components/TextInput";
import unescapeString from "@/lib/client/unescapeString";
import useLinkStore from "@/store/links";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import toast from "react-hot-toast";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faTrashCan } from "@fortawesome/free-solid-svg-icons";
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
  const [submitLoader, setSubmitLoader] = useState(false);

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
          <FontAwesomeIcon icon={faTrashCan} className="h-5" />
          Delete
        </button>
      </div>
    </Modal>
  );
}
