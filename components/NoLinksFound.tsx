import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import NewLinkModal from "./Modals/NewLinkModal";

type Props = {
  text?: string;
};

export default function NoLinksFound({ text }: Props) {
  const [newLinkModal, setNewLinkModal] = useState(false);

  return (
    <div className="border border-solid border-neutral-content w-full h-full flex flex-col justify-center p-10 rounded-2xl bg-base-200">
      <p className="text-center text-2xl">
        {text || "You haven't created any Links Here"}
      </p>
      <div className="text-center w-full mt-4">
        <div
          onClick={() => {
            setNewLinkModal(true);
          }}
          className="inline-flex gap-1 relative w-[11rem] items-center btn btn-accent text-white group"
        >
          <FontAwesomeIcon
            icon={faPlus}
            className="w-5 h-5 left-4 group-hover:ml-[4rem] absolute duration-100"
          />
          <span className="group-hover:opacity-0 text-right w-full duration-100">
            Create New Link
          </span>
        </div>
      </div>
      <NewLinkModal
        isOpen={newLinkModal}
        onClose={() => setNewLinkModal(false)}
        modalId="new-link-modal"
      />
    </div>
  );
}
