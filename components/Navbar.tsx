import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signOut } from "next-auth/react";
import { faPlus, faBars, faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import Dropdown from "@/components/Dropdown";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";
import SearchBar from "@/components/SearchBar";
import useAccountStore from "@/store/account";
import ProfilePhoto from "@/components/ProfilePhoto";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import ToggleDarkMode from "./ToggleDarkMode";
import useLocalSettingsStore from "@/store/localSettings";
import NewLinkModal from "./Modals/NewLink";
import NewCollectionModal from "./Modals/NewCollectionModal";

export default function Navbar() {
  const { settings, updateSettings } = useLocalSettingsStore();

  const { account } = useAccountStore();

  const [profileDropdown, setProfileDropdown] = useState(false);

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

  const [newLinkModalIsOpen, setNewLinkModalIsOpen] = useState(false);
  const closeNewLinkModal = () => setNewLinkModalIsOpen(false);
  const [newCollectionModalIsOpen, setNewCollectionModalIsOpen] =
    useState(false);
  const closeNewCollectionModal = () => setNewCollectionModalIsOpen(false);

  return (
    <div className="flex justify-between gap-2 items-center px-5 py-2 border-solid border-b-neutral-content border-b">
      <div
        onClick={toggleSidebar}
        className="text-neutral btn btn-square btn-sm btn-ghost lg:hidden"
      >
        <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
      </div>
      <SearchBar />
      <div className="flex items-center gap-2">
        <ToggleDarkMode className="sm:inline-grid hidden" />

        <div className="dropdown dropdown-end">
          <div className="tooltip tooltip-bottom" data-tip="Create New...">
            <div
              tabIndex={0}
              role="button"
              className="flex items-center group btn btn-accent text-white btn-sm"
            >
              <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
              <FontAwesomeIcon icon={faCaretDown} className="w-3 h-3" />
            </div>
          </div>
          <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-200 border border-neutral-content rounded-box w-52">
            <li>
              <div
                onClick={() => setNewLinkModalIsOpen(true)}
                tabIndex={0}
                role="button"
              >
                New Link
              </div>
            </li>
            <li>
              <div
                onClick={() => setNewCollectionModalIsOpen(true)}
                tabIndex={0}
                role="button"
              >
                New Collection
              </div>
            </li>
          </ul>
        </div>

        <div className="relative">
          <div
            className="btn btn-circle btn-ghost"
            onClick={() => setProfileDropdown(!profileDropdown)}
            id="profile-dropdown"
          >
            <ProfilePhoto
              src={account.image ? account.image : undefined}
              priority={true}
              className=""
            />
          </div>
          {profileDropdown ? (
            <Dropdown
              items={[
                {
                  name: "Settings",
                  href: "/settings/account",
                },
                {
                  name: `Switch to ${
                    settings.theme === "light" ? "Dark" : "Light"
                  }`,
                  onClick: () => {
                    setProfileDropdown(!profileDropdown);
                    handleToggle();
                  },
                },
                {
                  name: "Logout",
                  onClick: () => {
                    signOut();
                    setProfileDropdown(!profileDropdown);
                  },
                },
              ]}
              onClickOutside={(e: Event) => {
                const target = e.target as HTMLInputElement;
                if (target.id !== "profile-dropdown") setProfileDropdown(false);
              }}
              className="absolute top-11 right-0 z-20 w-36"
            />
          ) : null}

          {sidebar ? (
            <div className="fixed top-0 bottom-0 right-0 left-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center fade-in z-30">
              <ClickAwayHandler
                className="h-full"
                onClickOutside={toggleSidebar}
              >
                <div className="slide-right h-full shadow-lg">
                  <Sidebar />
                </div>
              </ClickAwayHandler>
            </div>
          ) : null}
        </div>
      </div>
      <NewLinkModal
        isOpen={newLinkModalIsOpen}
        onClose={closeNewLinkModal}
        modalId="new-link-modal"
      />
      <NewCollectionModal
        isOpen={newCollectionModalIsOpen}
        onClose={closeNewCollectionModal}
        modalId="new-collection-modal"
      />
    </div>
  );
}
