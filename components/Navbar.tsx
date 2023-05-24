// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signOut } from "next-auth/react";
import {
  faPlus,
  faCircleUser,
  faSliders,
  faArrowRightFromBracket,
  faChevronDown,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import Dropdown from "@/components/Dropdown";
import Modal from "@/components/Modal";
import AddLink from "@/components/Modal/AddLink";
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
    // lg:ml-64 xl:ml-80
    <div className="flex justify-between gap-2 items-center px-5 py-2 border-solid border-b-sky-100 border-b h-16">
      <div
        onClick={toggleSidebar}
        className="inline-flex lg:hidden gap-1 items-center select-none cursor-pointer p-2 text-sky-500 rounded-md hover:outline-sky-500 outline duration-100 bg-white outline-sky-100 outline-1"
      >
        <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
      </div>
      <Search />
      <div className="flex items-center gap-2">
        <div
          onClick={toggleLinkModal}
          className="inline-flex gap-1 items-center font-semibold select-none cursor-pointer px-2 sm:px-3 py-2 text-sky-500 hover:text-sky-600 rounded-md hover:outline-sky-500 outline duration-100 bg-white outline-sky-100 outline-1"
        >
          <FontAwesomeIcon icon={faPlus} className="w-6 h-6 sm:w-5 sm:h-5" />
          <span className="hidden sm:block">New Link</span>
        </div>

        <div className="relative">
          <div
            className="flex gap-1 group items-center w-fit bg-white text-gray-600 cursor-pointer"
            onClick={() => setProfileDropdown(!profileDropdown)}
            id="profile-dropdown"
          >
            {account.profilePic ? (
              <img
                src={account.profilePic}
                className="h-10 w-10 pointer-events-none rounded-full border-[3px] border-sky-100 group-hover:border-sky-500 duration-100"
                alt=""
              />
            ) : (
              <FontAwesomeIcon
                icon={faCircleUser}
                className="h-10 w-10 pointer-events-none group-hover:text-sky-600 duration-100"
              />
            )}
            <div className="pointer-events-none hidden sm:block group-hover:text-sky-600 duration-100">
              <div className="flex item-center gap-1">
                <p className="font-bold leading-3 hidden sm:block">
                  {account.name}
                </p>
                <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
              </div>
            </div>
          </div>
          {profileDropdown ? (
            <Dropdown
              items={[
                {
                  name: "Settings",
                  icon: <FontAwesomeIcon icon={faSliders} />,
                  onClick: () => {
                    toggleSettingsModal();
                    setProfileDropdown(!profileDropdown);
                  },
                },
                {
                  name: "Logout",
                  icon: <FontAwesomeIcon icon={faArrowRightFromBracket} />,
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
              <AddLink toggleLinkModal={toggleLinkModal} />
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
