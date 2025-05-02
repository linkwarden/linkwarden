import { dropdownTriggerer, isIphone, isPWA } from "@/lib/client/utils";
import React from "react";
import { useState } from "react";
import NewLinkModal from "./ModalContent/NewLinkModal";
import NewCollectionModal from "./ModalContent/NewCollectionModal";
import UploadFileModal from "./ModalContent/UploadFileModal";
import MobileNavigationButton from "./MobileNavigationButton";
import { useTranslation } from "next-i18next";

type Props = {};

export default function MobileNavigation({}: Props) {
  const { t } = useTranslation();
  const [newLinkModal, setNewLinkModal] = useState(false);
  const [newCollectionModal, setNewCollectionModal] = useState(false);
  const [uploadFileModal, setUploadFileModal] = useState(false);

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 duration-200 sm:hidden`}
      >
        <div
          className={`w-full flex bg-base-100 ${
            isIphone() && isPWA() ? "pb-5" : ""
          } border-solid border-t-neutral-content border-t`}
        >
          <MobileNavigationButton href={`/dashboard`} icon={"bi-house"} />
          <MobileNavigationButton
            href={`/links/pinned`}
            icon={"bi-pin-angle"}
          />
          <div className="dropdown dropdown-top -mt-4">
            <div
              tabIndex={0}
              role="button"
              onMouseDown={dropdownTriggerer}
              className={`flex items-center btn btn-accent dark:border-violet-400 text-white btn-circle w-20 h-20 px-2 relative`}
            >
              <span>
                <i className="bi-plus text-5xl pointer-events-none"></i>
              </span>
            </div>
            <ul className="dropdown-content z-[1] menu shadow bg-base-200 border border-neutral-content rounded-box mb-1 -ml-12">
              <li>
                <div
                  onClick={() => {
                    (document?.activeElement as HTMLElement)?.blur();
                    setNewLinkModal(true);
                  }}
                  tabIndex={0}
                  role="button"
                  className="whitespace-nowrap"
                >
                  {t("new_link")}
                </div>
              </li>
              <li>
                <div
                  onClick={() => {
                    (document?.activeElement as HTMLElement)?.blur();
                    setUploadFileModal(true);
                  }}
                  tabIndex={0}
                  role="button"
                  className="whitespace-nowrap"
                >
                  {t("upload_file")}
                </div>
              </li>
              <li>
                <div
                  onClick={() => {
                    (document?.activeElement as HTMLElement)?.blur();
                    setNewCollectionModal(true);
                  }}
                  tabIndex={0}
                  role="button"
                  className="whitespace-nowrap"
                >
                  {t("new_collection")}
                </div>
              </li>
            </ul>
          </div>
          <MobileNavigationButton href={`/links`} icon={"bi-link-45deg"} />
          <MobileNavigationButton href={`/collections`} icon={"bi-folder"} />
        </div>
      </div>
      {newLinkModal && <NewLinkModal onClose={() => setNewLinkModal(false)} />}
      {newCollectionModal && (
        <NewCollectionModal onClose={() => setNewCollectionModal(false)} />
      )}
      {uploadFileModal && (
        <UploadFileModal onClose={() => setUploadFileModal(false)} />
      )}
    </>
  );
}
