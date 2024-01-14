import { dropdownTriggerer } from "@/lib/client/utils";
import React from "react";
import { useEffect, useState } from "react";
import NewLinkModal from "./ModalContent/NewLinkModal";
import NewCollectionModal from "./ModalContent/NewCollectionModal";
import UploadFileModal from "./ModalContent/UploadFileModal";
import MobileNavigationButton from "./MobileNavigationButton";

type Props = {};

export default function MobileNavigation({}: Props) {
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
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 duration-200 sm:hidden ${
          hasScrolled ? "opacity-80" : ""
        }`}
      >
        <div className="dropdown dropdown-end dropdown-top absolute -top-20 right-5">
          <div
            tabIndex={0}
            role="button"
            onMouseDown={dropdownTriggerer}
            className={`flex items-center btn btn-accent dark:border-violet-400 text-white btn-circle btn-lg px-2 relative`}
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

        <div className="w-full flex bg-base-100 pb-5 border-solid border-t-neutral-content border-t">
          <MobileNavigationButton href={`/dashboard`} icon={"bi-house"} />
          <MobileNavigationButton
            href={`/links/pinned`}
            icon={"bi-pin-angle"}
          />
          <MobileNavigationButton href={`/links`} icon={"bi-link-45deg"} />
          <MobileNavigationButton href={`/collections`} icon={"bi-folder"} />
          <MobileNavigationButton href={`/tags`} icon={"bi-hash"} />
        </div>
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
