// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
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

export default function () {
  const { data: session } = useSession();

  const [profileDropdown, setProfileDropdown] = useState(false);

  const user = session?.user;

  const [linkModal, setLinkModal] = useState(false);
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

  return (
    <div className="flex justify-between gap-2 items-center px-5 py-2 border-solid border-b-sky-100 border-b">
      <div
        onClick={toggleSidebar}
        className="inline-flex lg:hidden gap-1 items-center select-none cursor-pointer p-1 text-sky-500 rounded-md hover:outline-sky-500 outline duration-100 bg-white outline-sky-100 outline-1"
      >
        <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
      </div>
      <Search />
      <div className="flex items-center gap-2">
        <div
          onClick={toggleLinkModal}
          title="New Link"
          className="inline-flex gap-1 items-center select-none cursor-pointer p-1 text-sky-500 rounded-md hover:outline-sky-500 outline duration-100 bg-white outline-sky-100 outline-1"
        >
          <FontAwesomeIcon icon={faPlus} className="w-6 h-6" />
        </div>

        {linkModal ? (
          <Modal toggleModal={toggleLinkModal}>
            <AddLink toggleLinkModal={toggleLinkModal} />
          </Modal>
        ) : null}

        <div className="relative">
          <div
            className="flex gap-2 items-center p-1 w-fit bg-white text-gray-600 cursor-pointer border border-sky-100 hover:border-sky-500 rounded-md duration-100"
            onClick={() => setProfileDropdown(!profileDropdown)}
            id="profile-dropdown"
          >
            <FontAwesomeIcon
              icon={faCircleUser}
              className="h-6 w-6 pointer-events-none"
            />
            <div className="flex items-center gap-1 pointer-events-none">
              <p className="font-bold leading-3 hidden sm:block">
                {user?.name}
              </p>
              <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
            </div>
          </div>
          {profileDropdown ? (
            <Dropdown
              items={[
                {
                  name: "Settings",
                  icon: <FontAwesomeIcon icon={faSliders} />,
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
              className="absolute top-9 right-0 z-20 w-36"
            />
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
