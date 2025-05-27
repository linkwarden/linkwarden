import { useEffect, useState } from "react";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";
import SearchBar from "@/components/SearchBar";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import ToggleDarkMode from "./ToggleDarkMode";
import NewLinkModal from "./ModalContent/NewLinkModal";
import NewCollectionModal from "./ModalContent/NewCollectionModal";
import UploadFileModal from "./ModalContent/UploadFileModal";
import MobileNavigation from "./MobileNavigation";
import ProfileDropdown from "./ProfileDropdown";
import { useTranslation } from "next-i18next";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { t } = useTranslation();
  const router = useRouter();

  const [sidebar, setSidebar] = useState(false);

  const { width } = useWindowDimensions();

  useEffect(() => {
    if (sidebar) setSidebar(false);
  }, [width, router]);

  useEffect(() => {
    document.body.style.overflow = "auto";
  }, [sidebar]);

  const toggleSidebar = () => {
    setSidebar(false);
    document.body.style.overflow = "auto";
  };

  const [newLinkModal, setNewLinkModal] = useState(false);
  const [newCollectionModal, setNewCollectionModal] = useState(false);
  const [uploadFileModal, setUploadFileModal] = useState(false);

  return (
    <div className="flex justify-between gap-2 items-center pl-3 pr-4 py-2 border-solid border-b-neutral-content border-b">
      <Button
        variant="ghost"
        size="icon"
        className="text-neutral lg:hidden sm:inline-flex"
        onClick={() => {
          setSidebar(true);
          document.body.style.overflow = "hidden";
        }}
      >
        <i className="bi-list text-xl leading-none" />
      </Button>

      <SearchBar />

      <div className="flex items-center gap-2">
        <ToggleDarkMode className="hidden sm:inline-grid" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="tooltip tooltip-bottom" data-tip={t("create_new")}>
              <Button
                variant="accent"
                size="sm"
                className="min-w-[3.3rem] h-[2rem]"
              >
                <span>
                  <i className="bi-plus text-4xl absolute -top-[0.15rem] left-0 pointer-events-none" />
                </span>
                <span>
                  <i className="bi-caret-down-fill text-xs absolute top-[0.7rem] right-[0.4rem] pointer-events-none" />
                </span>
              </Button>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setNewLinkModal(true)}>
              <i className="bi-link-45deg" />
              {t("new_link")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setUploadFileModal(true)}>
              <i className="bi-file-earmark-arrow-up" />
              {t("upload_file")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setNewCollectionModal(true)}>
              <i className="bi-folder" />
              {t("new_collection")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ProfileDropdown />
      </div>

      <MobileNavigation />

      {sidebar && (
        <div className="fixed top-0 bottom-0 right-0 left-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center fade-in z-40">
          <ClickAwayHandler className="h-full" onClickOutside={toggleSidebar}>
            <div className="slide-right h-full shadow-lg">
              <Sidebar />
            </div>
          </ClickAwayHandler>
        </div>
      )}
      {newLinkModal && <NewLinkModal onClose={() => setNewLinkModal(false)} />}
      {newCollectionModal && (
        <NewCollectionModal onClose={() => setNewCollectionModal(false)} />
      )}
      {uploadFileModal && (
        <UploadFileModal onClose={() => setUploadFileModal(false)} />
      )}
    </div>
  );
}
