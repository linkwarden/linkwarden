import { isIphone, isPWA } from "@/lib/utils";
import React from "react";
import { useState } from "react";
import NewLinkModal from "./ModalContent/NewLinkModal";
import NewCollectionModal from "./ModalContent/NewCollectionModal";
import UploadFileModal from "./ModalContent/UploadFileModal";
import MobileNavigationButton from "./MobileNavigationButton";
import { useTranslation } from "next-i18next";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="-mt-4 flex items-center btn btn-accent dark:border-violet-400 text-white btn-circle w-20 h-20 px-2 relative">
                <i className="bi-plus text-5xl pointer-events-none"></i>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setNewLinkModal(true)}>
                <i className="bi-link-45deg"></i>
                {t("new_link")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setUploadFileModal(true)}>
                <i className="bi-file-earmark-arrow-up"></i>
                {t("upload_file")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setNewCollectionModal(true)}>
                <i className="bi-folder"></i>
                {t("new_collection")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
