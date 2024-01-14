import { dropdownTriggerer } from "@/lib/client/utils";
import React from "react";
import { useEffect, useState } from "react";
import NewLinkModal from "./ModalContent/NewLinkModal";
import NewCollectionModal from "./ModalContent/NewCollectionModal";
import UploadFileModal from "./ModalContent/UploadFileModal";

type Props = {};

export default function NewButtonMobile({}: Props) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [newLinkModal, setNewLinkModal] = useState(false);
  const [newCollectionModal, setNewCollectionModal] = useState(false);
  const [uploadFileModal, setUploadFileModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <div className="dropdown dropdown-end dropdown-top sm:hidden fixed bottom-10 right-10 z-30">
        <div
          tabIndex={0}
          role="button"
          onMouseDown={dropdownTriggerer}
          className={`flex items-center btn btn-accent dark:border-violet-400 text-white btn-circle btn-lg px-2 relative ${
            hasScrolled ? "opacity-50" : ""
          }`}
        >
          <span>
            <i className="bi-plus text-5xl pointer-events-none"></i>
          </span>
        </div>
        <ul className="dropdown-content z-[1] menu shadow bg-base-200 border border-neutral-content rounded-box w-40 mb-1">
          <li>
            <div
              onClick={() => {
                (document?.activeElement as HTMLElement)?.blur();
                setNewLinkModal(true);
              }}
              tabIndex={0}
              role="button"
            >
              New Link
            </div>
          </li>
          {/* <li>
              <div
                onClick={() => {
                  (document?.activeElement as HTMLElement)?.blur();
                  setUploadFileModal(true);
                }}
                tabIndex={0}
                role="button"
              >
                Upload File
              </div>
            </li> */}
          <li>
            <div
              onClick={() => {
                (document?.activeElement as HTMLElement)?.blur();
                setNewCollectionModal(true);
              }}
              tabIndex={0}
              role="button"
            >
              New Collection
            </div>
          </li>
        </ul>
      </div>
      {newLinkModal ? (
        <NewLinkModal onClose={() => setNewLinkModal(false)} />
      ) : undefined}
      {newCollectionModal ? (
        <NewCollectionModal onClose={() => setNewCollectionModal(false)} />
      ) : undefined}
      {uploadFileModal ? (
        <UploadFileModal onClose={() => setUploadFileModal(false)} />
      ) : undefined}
    </>
  );
}
