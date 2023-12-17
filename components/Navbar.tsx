import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";
import SearchBar from "@/components/SearchBar";
import useAccountStore from "@/store/account";
import ProfilePhoto from "@/components/ProfilePhoto";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import ToggleDarkMode from "./ToggleDarkMode";
import useLocalSettingsStore from "@/store/localSettings";
import NewLinkModal from "./ModalContent/NewLinkModal";
import NewCollectionModal from "./ModalContent/NewCollectionModal";
import Link from "next/link";
import UploadFileModal from "./ModalContent/UploadFileModal";

export default function Navbar() {
  const { settings, updateSettings } = useLocalSettingsStore();

  const { account } = useAccountStore();

  const router = useRouter();

  const [sidebar, setSidebar] = useState(false);

  const { width } = useWindowDimensions();

  const handleToggle = () => {
    if (settings.theme === "dark") {
      updateSettings({ theme: "light" });
    } else {
      updateSettings({ theme: "dark" });
    }
  };

  useEffect(() => {
    setSidebar(false);
  }, [width]);

  useEffect(() => {
    setSidebar(false);
  }, [router]);

  const toggleSidebar = () => {
    setSidebar(!sidebar);
  };

  const [newLinkModal, setNewLinkModal] = useState(false);
  const [newCollectionModal, setNewCollectionModal] = useState(false);
  const [uploadFileModal, setUploadFileModal] = useState(false);

  return (
    <div className="flex justify-between gap-2 items-center pl-3 pr-4 py-2 border-solid border-b-neutral-content border-b">
      <div
        onClick={toggleSidebar}
        className="text-neutral btn btn-square btn-sm btn-ghost lg:hidden"
      >
        <i className="bi-list text-xl"></i>
      </div>
      <SearchBar />
      <div className="flex items-center gap-2">
        <ToggleDarkMode className="hidden sm:inline-grid" />

        <div className="dropdown dropdown-end">
          <div className="tooltip tooltip-bottom" data-tip="Create New...">
            <div
              tabIndex={0}
              role="button"
              className="flex min-w-[3.4rem] items-center group btn btn-accent dark:border-violet-400 text-white btn-sm px-2"
            >
              <span>
                <i className="bi-plus text-xl"></i>
              </span>
              <span>
                <i className="bi-caret-down-fill text-xs"></i>
              </span>
            </div>
          </div>
          <ul className="dropdown-content z-[1] menu shadow bg-base-200 border border-neutral-content rounded-box w-40 mt-1">
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

        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-circle btn-ghost">
            <ProfilePhoto
              src={account.image ? account.image : undefined}
              priority={true}
            />
          </div>
          <ul className="dropdown-content z-[1] menu shadow bg-base-200 border border-neutral-content rounded-box w-40 mt-1">
            <li>
              <Link
                href="/settings/account"
                onClick={() => (document?.activeElement as HTMLElement)?.blur()}
                tabIndex={0}
                role="button"
              >
                Settings
              </Link>
            </li>
            <li>
              <div
                onClick={() => {
                  (document?.activeElement as HTMLElement)?.blur();
                  handleToggle();
                }}
                tabIndex={0}
                role="button"
              >
                Switch to {settings.theme === "light" ? "Dark" : "Light"}
              </div>
            </li>
            <li>
              <div
                onClick={() => {
                  (document?.activeElement as HTMLElement)?.blur();
                  signOut();
                }}
                tabIndex={0}
                role="button"
              >
                Logout
              </div>
            </li>
          </ul>
        </div>
      </div>
      {sidebar ? (
        <div className="fixed top-0 bottom-0 right-0 left-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center fade-in z-30">
          <ClickAwayHandler className="h-full" onClickOutside={toggleSidebar}>
            <div className="slide-right h-full shadow-lg">
              <Sidebar />
            </div>
          </ClickAwayHandler>
        </div>
      ) : null}
      {newLinkModal ? (
        <NewLinkModal onClose={() => setNewLinkModal(false)} />
      ) : undefined}
      {newCollectionModal ? (
        <NewCollectionModal onClose={() => setNewCollectionModal(false)} />
      ) : undefined}
      {uploadFileModal ? (
        <UploadFileModal onClose={() => setUploadFileModal(false)} />
      ) : undefined}
    </div>
  );
}
