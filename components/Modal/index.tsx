// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { MouseEventHandler, ReactNode } from "react";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

type Props = {
  toggleModal: Function;
  children: ReactNode;
};

export default function ({ toggleModal, children }: Props) {
  return (
    <div className="overflow-y-auto py-2 fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 flex items-center fade-in z-30">
      <ClickAwayHandler onClickOutside={toggleModal} className="w-fit m-auto">
        <div className="slide-up relative border-sky-100 rounded-md border-solid border shadow-lg p-5 bg-white">
          <div
            onClick={toggleModal as MouseEventHandler<HTMLDivElement>}
            className="absolute top-5 left-5 inline-flex rounded-md cursor-pointer hover:bg-white hover:border-sky-500 border-sky-100 border duration-100 p-1"
          >
            <FontAwesomeIcon
              icon={faChevronLeft}
              className="w-4 h-4 text-gray-500"
            />
          </div>
          {children}
        </div>
      </ClickAwayHandler>
    </div>
  );
}
