import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signOut } from "next-auth/react";
import {
  faPlus,
  faCircleUser,
  faChevronDown,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import Dropdown from "@/components/Dropdown";
import Modal from "@/components/Modal";
import LinkModal from "@/components/Modal/LinkModal";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";
import Search from "@/components/Search";
import UserSettings from "./Modal/UserSettings";
import useAccountStore from "@/store/account";

export default function () {
  const { account } = useAccountStore();

  const [profileDropdown, setProfileDropdown] = useState(false);

  const [linkModal, setLinkModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [sidebar, setSidebar] = useState(false);

  const router = useRouter();

  window.addEventListener("resize", () => setSidebar(false));

  useEffect(() => {
    setSidebar(false);
  }, [router]);

  const toggleSidebar = () => {
    setSidebar(!sidebar);
  };

  const toggleLinkModal = () => {
    setLinkModal(!linkModal);
  };

  const toggleSettingsModal = () => {
    setSettingsModal(!settingsModal);
  };

  return (
    <div className="flex justify-between gap-2 items-center px-5 py-2 border-solid border-b-sky-100 border-b h-16">
      <div
        onClick={toggleSidebar}
        className="inline-flex lg:hidden gap-1 items-center select-none cursor-pointer p-[0.687rem] text-gray-500 rounded-md duration-100 hover:bg-slate-200"
      >
        <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
      </div>
      <Search />
      <div className="flex items-center gap-2">
        <div
          onClick={toggleLinkModal}
          className="inline-flex gap-1 relative sm:w-[7.2rem] items-center font-semibold select-none cursor-pointer p-[0.687rem] sm:p-2 sm:px-3 rounded-md sm:rounded-full hover:bg-sky-100 text-sky-500 sm:text-white sm:bg-sky-500 sm:hover:bg-sky-400 duration-100 group"
        >
          <FontAwesomeIcon
            icon={faPlus}
            className="w-5 h-5 sm:group-hover:ml-9 sm:absolute duration-100"
          />
          <span className="hidden sm:block group-hover:opacity-0 text-right w-full duration-100">
            New Link
          </span>
        </div>

        <div className="relative">
          <div
            className="flex gap-1 group items-center w-fit bg-white cursor-pointer"
            onClick={() => setProfileDropdown(!profileDropdown)}
            id="profile-dropdown"
          >
            {account.profilePic ? (
              <img
                src={account.profilePic}
                className="h-10 w-10 shadow pointer-events-none rounded-full border-[3px] border-sky-500 group-hover:border-sky-400 duration-100"
                alt=""
                id="profile-dropdown"
              />
            ) : (
              <FontAwesomeIcon
                icon={faCircleUser}
                id="profile-dropdown"
                className="h-10 w-10 pointer-events-none text-sky-500 group-hover:text-sky-400 duration-100"
              />
            )}
            <div
              id="profile-dropdown"
              className="text-sky-500 group-hover:text-sky-400 duration-100 hidden sm:flex item-center gap-1 max-w-[8rem]"
            >
              <p
                id="profile-dropdown"
                className="font-bold leading-3 hidden sm:block select-none truncate"
              >
                {account.name}
              </p>
              <FontAwesomeIcon
                id="profile-dropdown"
                icon={faChevronDown}
                className="h-3 w-3"
              />
            </div>
          </div>
          {profileDropdown ? (
            <Dropdown
              items={[
                {
                  name: "Settings",
                  onClick: () => {
                    toggleSettingsModal();
                    setProfileDropdown(!profileDropdown);
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

          {linkModal ? (
            <Modal toggleModal={toggleLinkModal}>
              <LinkModal toggleLinkModal={toggleLinkModal} method="CREATE" />
            </Modal>
          ) : null}

          {settingsModal ? (
            <Modal toggleModal={toggleSettingsModal}>
              <UserSettings toggleSettingsModal={toggleSettingsModal} />
            </Modal>
          ) : null}

          {sidebar ? (
            <div className="fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 flex items-center fade-in z-30">
              <ClickAwayHandler onClickOutside={toggleSidebar}>
                <div className="slide-right shadow-lg">
                  <Sidebar />
                </div>
              </ClickAwayHandler>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
